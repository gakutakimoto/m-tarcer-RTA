// -----------------------------------------------------------------------------
// components/SuccessKeys.tsx
//   – クラスタ別「成功へのカギ」 TOP3 を表示
// -----------------------------------------------------------------------------
"use client";

import React, { useMemo } from "react";

/* -------------------- props -------------------- */
export interface KeyItem {
  feature: string;          // 変数名
  median:  number;          // 目標値
  importance: number;       // 寄与度 (0‒100 想定)
}

interface Props {
  swing: Record<string, number | null>; // 現在のスイング値
  keys: KeyItem[];                      // featureImportance.json から抽出済み TOP3
}

/* -------------------- utils -------------------- */
const unit: Record<string, string> = {
  addressHandFirst: "°",
  addressLieAngle:  "°",
  halfwaydownFaceAngleToVertical: "°",
  halfwaybackFaceAngleToVertical: "°",
  topFaceAngleToHorizontal: "°",
  downSwingShaftRotationMax: "°/s",
  downSwingShaftRotationMin: "°/s",
  impactGripSpeed: "m/s",
  impactClubPath: "°",
  // 必要に応じて追加
};

const label: Record<string, string> = {
  addressHandFirst: "HandFirst",
  addressLieAngle:  "Lie (Addr→Imp)",
  halfwaydownFaceAngleToVertical: "HD Face",
  halfwaybackFaceAngleToVertical: "HB Face",
  topFaceAngleToHorizontal: "Closure",
  downSwingShaftRotationMax: "SR Max",
  downSwingShaftRotationMin: "SR Min",
  impactGripSpeed: "GripSpd",
  impactClubPath: "ClubPath",
};

/* ===================================================================== */
export default function SuccessKeys({ swing, keys }: Props) {
  /* 差分を計算してチャートデータ化 */
  const rows = useMemo(() => {
    return keys.map((k) => {
      const now = Number(swing[k.feature] ?? 0);
      const diff = now - k.median;
      return { ...k, now, diff };
    });
  }, [keys, swing]);

  if (!rows.length) return null;

  return (
    <div className="bg-[#0e1524] rounded-lg p-2">
      <h3 className="text-base mb-1">成功へのカギ 🔑（Top&nbsp;3）</h3>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.feature} className="flex items-center gap-3">
            {/* 変数ラベル */}
            <span className="w-24 text-xs text-gray-300">{label[r.feature] ?? r.feature}</span>

            {/* バー（寄与度を長さに） */}
            <div className="flex-1 h-2 bg-gray-700/50 rounded">
              <div
                className="h-2 rounded bg-emerald-500"
                style={{ width: `${Math.min(r.importance, 100)}%` }}
              />
            </div>

            {/* 現在値 / 目標値 */}
            <span className="w-20 text-right text-xs">
              {r.now.toFixed(1)}
              {unit[r.feature] ?? ""}
            </span>
            <span className="w-14 text-right text-[10px] text-gray-400">
              → {r.median.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
