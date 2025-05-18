// -----------------------------------------------------------------------------
// utils/calcSixAxisScore.ts
//   偏差値風 0-100 スコアを返す
//   - 成功スイング中央値 (mu80) を 80 点に固定
//   - 値は 0–100 にクリップ
// -----------------------------------------------------------------------------

import driverRaw from "@/data/six_axis_stats_driver.json";
import ironRaw   from "@/data/six_axis_stats_iron.json";

const driverStats = (driverRaw as any).default ?? (driverRaw as any);
const ironStats   = (ironRaw   as any).default   ?? (ironRaw   as any);

export type SixAxis =
  | "halfwaybackFaceAngleToVertical"   // HB
  | "halfwaydownFaceAngleToVertical"   // HD
  | "impactHandFirst"                  // HandFirst
  | "LieDelta"
  | "SRDelta"
  | "ClosureAngle";

export function calcSixAxisScore(
  axis: SixAxis,
  value: number,
  club: "D" | "I"
): number {
  const stats = club === "D" ? driverStats : ironStats;
  const entry = stats[axis];
  if (!entry) return 50;                  // 定義なし→平均 50

  const { mu80, sigma } = entry;
let score = 80 + 10 * (value - mu80) / sigma;
score = Math.max(0, Math.min(100, score));
return Number(score.toFixed(1)); 
}
// -----------------------------------------------------------------------------
