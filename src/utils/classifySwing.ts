// -----------------------------------------------------------------------------
// classifySwing  – 1 スイングの生データ → 0‒9 のクラスタ番号を返す
// 仕様：
//   • 7 変数すべてレンジ内なら即そのクラスタを返す
//   • 全一致が無い場合は、「レンジ内の項目数」と「中央値からの距離」で最も近いクラスタ
// -----------------------------------------------------------------------------
import { clusterThresholds } from "@/data/clusterThresholds";

// 7 変数が入った生スイング型（その他カラムが入っていても OK）
export interface RawSwing {
  [key: string]: number;
}

const inRange = (v: number, [min, max]: [number, number]) =>
  v >= min && v <= max;

export function classifySwing(swing: RawSwing): number {
  let bestId = -1;
  let bestScore = -1;
  let bestDist = Infinity;

  for (const [idStr, ranges] of Object.entries(clusterThresholds)) {
    const id = Number(idStr);
    let inside = 0;
    let distSum = 0;

    for (const [key, range] of Object.entries(ranges)) {
      const v = swing[key];
      // 必須キーの欠落はスキップ
      if (v === undefined || isNaN(v)) {
        inside = -1;
        break;
      }
      if (inRange(v, range as [number, number])) inside++;
      distSum += Math.abs(v - (range[0] + range[1]) / 2); // 中央との差
    }

    if (inside === -1) continue;                 // キー不足は評価外
    if (inside === Object.keys(ranges).length) { // 完全一致！
      return id;
    }
    if (
      inside > bestScore ||
      (inside === bestScore && distSum < bestDist)
    ) {
      bestId = id;
      bestScore = inside;
      bestDist  = distSum;
    }
  }
  return bestId; // 最も“近い”クラスタ
}
