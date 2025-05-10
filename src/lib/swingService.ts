// src/lib/swingService.ts (修正版 - 常に暗号化、PHPレスポンスログ追加)
import axios from 'axios';

// 環境変数から設定を読み込む
const MTRACER_BASE_URL = process.env.MTRACER_URL || 'https://obs.m-tracer.golf';
const ENCRYPTION_ENDPOINT_URL = process.env.ENCRYPTION_ENDPOINT_URL;

// フロントエンドが期待する型 (rta/page.tsx の RTASwing interface に合わせる)
interface RTASwing {
  clubType: "D" | "I";
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number;
  impactPointY: number;
  swingDate?: string;
}

// M-Tracer APIのmeasurementInfoの型 (必要なものだけ抜粋)
interface MeasurementInfoFromApi {
  clubType?: string;
  carry?: number;
  impactHeadSpeed?: number;
  impactFaceAngle?: number;
  impactAttackAngle?: number;
  impactLoftAngle?: number;
  impactClubPath?: number;
  impactRelativeFaceAngle?: number;
  impactPointX?: number;
  impactPointY?: number;
}

// M-Tracer APIのswing_detailレスポンスの型 (主要部分)
interface MTracerSwingDetailResponse {
  status: boolean;
  message?: string;
  data?: {
    measurementInfo?: MeasurementInfoFromApi;
    headerInfo?: {
        swingDate?: string;
    };
  };
}

function parseMTracerData(apiResponse: MTracerSwingDetailResponse): RTASwing | null {
  const measurementInfo = apiResponse.data?.measurementInfo;
  const headerInfo = apiResponse.data?.headerInfo;

  if (!measurementInfo) {
    console.error("[swingService] parseMTracerData: measurementInfo is missing.");
    return null;
  }

  const getNumber = (val: any, defaultValue = 0): number => {
    const num = parseFloat(val);
    return isNaN(num) ? defaultValue : num;
  };

  const getClubType = (val: any, defaultValue = "D"): "D" | "I" => {
    if (typeof val === 'string' && (val.toUpperCase() === "D" || val.toUpperCase() === "I")) {
      return val.toUpperCase() as "D" | "I";
    }
    return defaultValue;
  };

  return {
    clubType: getClubType(measurementInfo.clubType, "D"),
    estimateCarry: getNumber(measurementInfo.carry),
    impactHeadSpeed: measurementInfo.impactHeadSpeed != null ? getNumber(measurementInfo.impactHeadSpeed) : null,
    impactFaceAngle: getNumber(measurementInfo.impactFaceAngle),
    impactAttackAngle: getNumber(measurementInfo.impactAttackAngle),
    impactLoftAngle: getNumber(measurementInfo.impactLoftAngle),
    impactClubPath: getNumber(measurementInfo.impactClubPath),
    impactRelativeFaceAngle: getNumber(measurementInfo.impactRelativeFaceAngle),
    impactPointX: getNumber(measurementInfo.impactPointX),
    impactPointY: getNumber(measurementInfo.impactPointY),
    swingDate: headerInfo?.swingDate,
  };
}

export async function fetchLatestSwingDataForRTA(originalUid: string): Promise<RTASwing | null> {
  console.log(`[swingService] Initiating fetch for UID: "${originalUid}" (Length: ${originalUid.length})`);
  let encUid = "";

  console.log(`[swingService] Forcing encryption for UID "${originalUid}"`);
  if (!ENCRYPTION_ENDPOINT_URL) {
    console.error("[swingService] Encryption endpoint URL is not configured in .env.local. Please set ENCRYPTION_ENDPOINT_URL.");
    throw { status: 500, message: 'Encryption endpoint URL is not configured.' };
  }
  if (!MTRACER_BASE_URL) {
    console.error("[swingService] M-Tracer base URL is not configured in .env.local. Please set MTRACER_URL.");
    throw { status: 500, message: 'M-Tracer base URL is not configured.' };
  }

  try {
    // --- 暗号化PHP呼び出し ---
    // PHPスクリプトが application/x-www-form-urlencoded 形式を期待すると仮定
    const params = new URLSearchParams();
    params.append('uid', originalUid.trim()); // PHP側が $_POST['uid'] で受け取る想定

    console.log("[swingService] Calling encryption PHP at:", ENCRYPTION_ENDPOINT_URL);
    console.log("[swingService] Sending to encryption PHP with params:", params.toString());

    const encResponse = await axios.post(ENCRYPTION_ENDPOINT_URL, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000, // タイムアウトを10秒に設定
    });

    // PHPからの生のレスポンスをログ出力
    console.log("[swingService] Raw response data from encryption PHP:", JSON.stringify(encResponse.data, null, 2));

    // PHPからのレスポンス形式が {"encrypted_uid": "xxxx"} であることを期待
    if (!encResponse.data || typeof encResponse.data.encrypted_uid === 'undefined' || encResponse.data.encrypted_uid === "") {
        console.error("[swingService] Encryption failed: 'encrypted_uid' key missing, empty, or invalid response from PHP.", encResponse.data);
        throw { status: 502, message: "Encryption service returned invalid data or 'encrypted_uid' was missing/empty."};
    }
    encUid = encResponse.data.encrypted_uid;
    console.log(`[swingService] Successfully encrypted. Encrypted UID from PHP: ${encUid}`);

  } catch (error: any) {
    console.error("[swingService] Error during encryption PHP call:");
    if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data,
        });
        const status = error.response?.status || 503; // 503 Service Unavailable
        const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Encryption service request failed';
        throw { status, message };
    } else {
        // axios以外のエラー (ネットワークエラーなど)
        console.error("Non-Axios error details:", error);
        throw { status: 503, message: `Encryption service connection failed: ${error.message}` };
    }
  }

  if (!encUid) {
    console.error("[swingService] encUid is still empty after encryption attempt. This should not happen if no error was thrown before.");
    throw { status: 500, message: "Failed to obtain encrypted UID due to an unexpected issue." };
  }

  // --- M-Tracer API呼び出し ---
  const apiUrl = `${MTRACER_BASE_URL}/api/swing_detail?uid=${encodeURIComponent(encUid)}&latest=true`;
  console.log("[swingService] Fetching from M-Tracer API:", apiUrl);

  try {
    const response = await axios.get<MTracerSwingDetailResponse>(apiUrl, {
      headers: { 'User-Agent': 'YourApp/1.0 (swingService)' },
      timeout: 15000,
    });

    console.log("[swingService] Raw response data from M-Tracer API:", JSON.stringify(response.data, null, 2));


    if (response.data?.status === false) {
      console.error(`[swingService] M-Tracer API returned logical error: ${response.data.message} (Encrypted UID: ${encUid})`);
      throw { status: response.status || 400, message: `M-Tracer API Error: ${response.data.message || 'param failed'}` };
    }

    console.log("[swingService] M-Tracer API response status (expecting true):", response.data?.status);
    const parsedData = parseMTracerData(response.data);

    if (!parsedData) {
        console.error("[swingService] Failed to parse data from M-Tracer API. measurementInfo might be missing. Raw data logged above.");
        throw { status: 500, message: "Failed to parse data from M-Tracer API (measurementInfo might be missing)." };
    }
    console.log("[swingService] Successfully fetched and parsed swing data from M-Tracer.");
    return parsedData;

  } catch (error: any) {
    console.error("[swingService] Error during M-Tracer API call or data parsing:");
    if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data,
        });
        const status = error.response?.status || 502;
        const message = error.response?.data?.message || error.response?.data?.error || error.message || "M-Tracer API request failed.";
        throw { status, message };
    } else if (error.status && error.message) { // 既にカスタムエラーオブジェクトの場合
        console.error("Custom error details:", error);
        throw error;
    } else {
        console.error("Non-Axios error details:", error);
        throw { status: 500, message: error.message || "Failed to fetch or parse swing data from M-Tracer." };
    }
  }
}