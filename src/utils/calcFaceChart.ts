// -----------------------------------------------------------------------------
// utils/calcFaceChart.ts – フェース角ウォーターフォール用データ生成
//   • 2025-05-13 係数 & ベースライン（クラブ種別）対応版
//   • Address & HB は「バー高さ 0°・ラベルのみ」方式
// -----------------------------------------------------------------------------
import baselineByClub from "@/data/success_baseline_byClub.json";

/* ------------ 型 ------------ */
export interface RTASwing {
  clubType: "D" | "I";          // ドライバー / アイアン
  closureAngle: number;         // topFace - HB  [deg]
  srDelta: number;              // shaftRotMax - Min  [deg/s]
  HD: number;                   // halfwayDownFaceAngleToVertical [deg]
  HandFirstDeg: number;         // 先行(−)/遅れ(＋)  [deg]
  LieDelta: number;             // impactLie - addressLie  [deg]
  impactFaceAngle: number;      // 実測 FA  [deg]
}

export interface FaceChartBar {
  name: string;
  delta: number;
}

export interface FaceChartData {
  bars: FaceChartBar[];   // 7 本（Address・HB は高さ 0）
  yourLine: number[];     // 8 点（Address〜FA）
  modelLine: number[];    // 8 点（成功モデル）
}

/* ------------ 係数 ΔFA / Δx (2025-05-13 回帰結果) ------------ */
const COEF = {
  closure:   0.0069,
  srDelta:  -0.0021,
  HD:        0.1300,
  HandFirst: -0.6471,
  LieDelta:  0.4352,
};

/* ------------ メイン関数 ------------ */
export function calcFaceChart(swing: RTASwing): FaceChartData {
  /* === ベースライン（クラブ種別） === */
  const club = swing.clubType ?? "D";
  const baseline = (baselineByClub as any)[club];

  /* === あなたのスイング：バー Δ === */
  const bars: FaceChartBar[] = [
    { name: "Address",    delta: 0 },  // ラベルのみ
    { name: "HB",         delta: 0 },  // ラベルのみ
    { name: "Closure",    delta: COEF.closure   * swing.closureAngle },
    { name: "SRΔ",        delta: COEF.srDelta   * swing.srDelta },
    { name: "HD",         delta: COEF.HD        * swing.HD },
    { name: "HandFirst",  delta: COEF.HandFirst * swing.HandFirstDeg },
    { name: "LieΔ",       delta: COEF.LieDelta  * swing.LieDelta },
  ];

  /* ---- 累積ライン（あなた） ---- */
  const yourLine: number[] = [0];
  bars.forEach(b => yourLine.push(yourLine[yourLine.length - 1] + b.delta));
  // インパクト実測値で最後を上書き
  yourLine[yourLine.length - 1] = swing.impactFaceAngle;

  /* === 成功モデルライン === */
  const modelBars: FaceChartBar[] = [
    { name: "Address",    delta: 0 },
    { name: "HB",         delta: 0 },
    { name: "Closure",    delta: COEF.closure   * baseline.ClosureAngle },
    { name: "SRΔ",        delta: COEF.srDelta   * baseline.SRDelta },
    { name: "HD",         delta: COEF.HD        * baseline.halfwaydownFaceAngleToVertical },
    { name: "HandFirst",  delta: COEF.HandFirst * baseline.HandFirstDeg },
    { name: "LieΔ",       delta: COEF.LieDelta  * baseline.LieDelta },
  ];

  const modelLine: number[] = [0];
  modelBars.forEach(b => modelLine.push(modelLine[modelLine.length - 1] + b.delta));
  modelLine[modelLine.length - 1] = baseline.impactFaceAngle;

  return { bars, yourLine, modelLine };
}
// -----------------------------------------------------------------------------
