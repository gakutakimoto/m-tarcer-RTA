// -----------------------------------------------------------------------------
// utils/faceDeltas.ts
//   ⎯ M-Tracer 生データ → ウォーターフォール用 Δ(差分) & 累積値へ変換
// -----------------------------------------------------------------------------

/* ===== ① フロントで受け取るスイング型 ===== */
export interface RTASwingForWF {
  impactFaceAngle: number;                      // θ_FA（インパクト実フェース角）
  impactClubPath: number;                       // CP   （クラブパス補正）
  halfwaybackFaceAngleToVertical: number | null;    // θ_HB
  topFaceAngleToHorizontal: number | null;          // θ_TOP
  halfwaydownFaceAngleToVertical: number | null;    // θ_HD
}

/* ===== ② Δ(差分) 1本分の型 ===== */
export interface PhaseDelta {
  name: "Address" | "HB" | "TOP" | "HD" | "Path" | "FA";
  delta: number;        // 棒グラフにする値（差分）
}

/* ===== ③ 変換メイン関数 ===== */
/**
 * M-Tracer の各フェーズ実測角を
 *   – `bars` : Δ(差分) 配列
 *   – `cum`  : 累積フェース角推移
 * に変換して返す。
 *
 * bars は
 *   Address→HB→TOP→HD→Path→FA
 * の順で必ず 6 本。
 * cum の末尾値は必ず impactFaceAngle と一致する。
 */
export function buildFaceWaterfallData(s: RTASwingForWF) {
  /* ---------- 実測角を取り出し & null セーフティ ---------- */
  const θHB  = s.halfwaybackFaceAngleToVertical ?? 0;
  const θTOP = s.topFaceAngleToHorizontal       ?? θHB;
  const θHD  = s.halfwaydownFaceAngleToVertical ?? θTOP;
  const CP   = s.impactClubPath;
  const θFA  = s.impactFaceAngle;

  /* ---------- Δ(差分)＝バー用 ---------- */
  const bars: PhaseDelta[] = [
    { name: "Address", delta: 0 },
    { name: "HB",      delta:  θHB },
    { name: "TOP",     delta:  θTOP - θHB },
    { name: "HD",      delta:  θHD  - θTOP },
    { name: "Path",    delta:  CP },
    { name: "FA",      delta:  θFA - (θHD + CP) },
  ];

  /* ---------- 累積＝破線用 ---------- */
  let acc = 0;
  const cum: number[] = bars.map((b) => (acc += b.delta));

  return { bars, cum };
}
