// -----------------------------------------------------------------------------
// Stage-2 5 変数対応 + impactGripSpeed 追加版
// -----------------------------------------------------------------------------
// dynamic = SSR 強制
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { toDI } from "@/utils/clubType";

/* ========================================================================= *
 * 環境変数 & 定数
 * ========================================================================= */
const MTRACER_BASE_URL =
  process.env.MTRACER_URL || "https://obs.m-tracer.golf";
const ENCRYPTION_ENDPOINT_URL = process.env.ENCRYPTION_ENDPOINT_URL;

/* ========================================================================= *
 * 型定義
 * ========================================================================= */
export interface RTASwing {
  /* --- 基本情報 --- */
  clubType: "D" | "I";
  swingDate?: string;

  /* --- 結果系（ウォーターフォール最終点） --- */
  estimateCarry: number;
  impactFaceAngle: number;

  /* --- 補助系 --- */
  impactGripSpeed: number;            // ★ 追加
  impactHeadSpeed: number | null;
  impactAttackAngle: number;
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number;
  impactPointY: number;

  /* --- Stage-2 5 変数に必要な計測値 --- */
  halfwaybackFaceAngleToVertical: number; // HB (表示のみ)
  topFaceAngleToHorizontal: number;       // ClosureAngle ↑
  halfwaydownFaceAngleToVertical: number; // ClosureAngle, HD ↓

  downSwingShaftRotationMax: number;      // SRΔ ↑
  downSwingShaftRotationMin: number;      // SRΔ ↓

  impactHandFirst: number;                // HandFirst
  impactLieAngle: number;                 // LieΔ ↑
  addressLieAngle: number;                // LieΔ ↓
}

interface SwingListItem {
  swingId: string;
  swingDate: string;
  club_type?: string;
}
interface SwingListRes {
  status: boolean;
  message?: string;
  data?: { [k: string]: SwingListItem } | SwingListItem[];
}
interface SwingDetailRes {
  status: boolean;
  message?: string;
  data?: any;
}

/* ========================================================================= *
 * ユーティリティ
 * ========================================================================= */
const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const num = (v: any, def = 0) => (v == null ? def : Number.parseFloat(v) || def);

// measurementInfo を深掘り検索
function findMeasurementInfo(obj: any): any | null {
  if (!obj || typeof obj !== "object") return null;
  if (obj.measurementInfo) return obj.measurementInfo;
  if (obj.measurementinfo) return obj.measurementinfo;
  if (obj.raw_data?.measurementInfo) return obj.raw_data.measurementInfo;
  for (const k of Object.keys(obj)) {
    const found = findMeasurementInfo(obj[k]);
    if (found) return found;
  }
  return null;
}

// measurementInfo → RTASwing へ整形
function toRTASwing(mi: any, header: any, latest: SwingListItem): RTASwing {
  /* --- clubType 判定 -------------------------------------------------- */
  const clubTypeResolved: "D" | "I" =
    mi.clubLength != null
      ? mi.clubLength >= 1
        ? "D"
        : "I"
      : toDI(mi.clubType ?? latest?.club_type ?? "");

  return {
    clubType: clubTypeResolved,
    swingDate: header?.swingDate ?? latest.swingDate,

    /* --- 結果系 --- */
    estimateCarry: num(mi.estimateCarry),
    impactFaceAngle: num(mi.impactFaceAngle),

    /* --- 補助系 --- */
    impactGripSpeed: num(mi.impactGripSpeed),               // ★ 追加
    impactHeadSpeed: mi.impactHeadSpeed != null ? num(mi.impactHeadSpeed) : null,
    impactAttackAngle: num(mi.impactAttackAngle),
    impactLoftAngle: num(mi.impactLoftAngle),
    impactClubPath: num(mi.impactClubPath),
    impactRelativeFaceAngle: num(mi.impactRelativeFaceAngle),
    impactPointX: num(mi.impactPointX),
    impactPointY: num(mi.impactPointY),

    /* --- Stage-2 必須計測値 --- */
    halfwaybackFaceAngleToVertical: num(mi.halfwaybackFaceAngleToVertical),
    topFaceAngleToHorizontal:       num(mi.topFaceAngleToHorizontal),
    halfwaydownFaceAngleToVertical: num(mi.halfwaydownFaceAngleToVertical),

    downSwingShaftRotationMax: num(mi.downSwingShaftRotationMax),
    downSwingShaftRotationMin: num(mi.downSwingShaftRotationMin),

    impactHandFirst:  num(mi.impactHandFirst),
    impactLieAngle:   num(mi.impactLieAngle),
    addressLieAngle:  num(mi.addressLieAngle),
  };
}

/* ========================================================================= *
 * エンドポイント
 * ========================================================================= */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid")?.trim();
  const days = Number.parseInt(req.nextUrl.searchParams.get("days") ?? "1", 10);

  if (!uid) return NextResponse.json({ error: "UID必須" }, { status: 400 });
  if (!ENCRYPTION_ENDPOINT_URL || !MTRACER_BASE_URL)
    return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });

  try {
    /* ----------------- 1) UID 暗号化 ----------------- */
    const encUid: string = (
      await axios.post(
        ENCRYPTION_ENDPOINT_URL,
        { uid },
        { headers: { "Content-Type": "application/json" }, timeout: 10_000 }
      )
    ).data?.encrypted_uid;
    if (!encUid) throw new Error("UID暗号化失敗");

    /* ----------------- 2) スイングリスト取得 --------- */
    const today = new Date();
    const listUrl = `${MTRACER_BASE_URL}/api/swing_list?uid=${encodeURIComponent(
      encUid
    )}&start_date=${formatDate(new Date(today.getTime() - days * 86_400_000))}&end_date=${formatDate(
      today
    )}`;

    const list: SwingListRes = (
      await axios.get(listUrl, {
        headers: { "User-Agent": "mtracer-ai (list)" },
        timeout: 15_000,
      })
    ).data;
    if (!list.status) throw new Error(list.message);

    const swings: SwingListItem[] = Array.isArray(list.data)
      ? list.data
      : Object.values(list.data || {});
    if (!swings.length)
      return NextResponse.json({ message: "スイング無し" }, { status: 404 });

    swings.sort((a, b) => Date.parse(b.swingDate) - Date.parse(a.swingDate));
    const latest = swings[0];

    /* ----------------- 3) スイング詳細取得 ----------- */
    const detailUrl = `${MTRACER_BASE_URL}/api/swing_detail?uid=${encodeURIComponent(
      encUid
    )}&swing_id=${latest.swingId}`;

    const detail: SwingDetailRes = (
      await axios.get(detailUrl, {
        headers: { "User-Agent": "mtracer-ai (detail)" },
        timeout: 15_000,
      })
    ).data;
    if (!detail.status) throw new Error(detail.message);

    const mi = findMeasurementInfo(detail.data);
    if (!mi) throw new Error("measurementInfo が見つかりません");

    const header = detail.data?.raw_data?.headerInfo ?? detail.data?.headerInfo;

    /* ----------------- 4) 整形して返却 --------------- */
    return NextResponse.json(toRTASwing(mi, header, latest));
  } catch (e: any) {
    console.error("RTA API Error:", e?.message);
    const status = e?.response?.status ?? 500;
    const msg =
      e?.response?.data?.error ?? e?.response?.data?.message ?? e.message ?? "unknown";
    return NextResponse.json({ error: msg }, { status });
  }
}
// -----------------------------------------------------------------------------
