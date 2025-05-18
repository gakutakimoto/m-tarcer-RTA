// ---------------------------------------------------------------------------
// src/components/SuccessBars.tsx
//   横バー：median 中央固定 / 目標帯ラベル / ホームベース形マーカー
//   ＋ 8 刻み実数目盛りをバー上に描画
// ---------------------------------------------------------------------------
"use client";

import React, { useMemo } from "react";

/* ---------- props ---------- */
interface KeyItem {
  feature: string;
  median: number;
  importance: number;
}
interface Props {
  swing: Record<string, number | null>;
  keys: KeyItem[];
}

/* ---------- ラベル & 単位マップ ---------- */
const LABEL: Record<string, string> = {
  addressHandFirst:               "Address HandFirst",
  addressLieAngle:                "Address LieAngle",
  halfwaydownFaceAngleToVertical: "Halfwaydown FaceAngle",
  halfwaybackFaceAngleToVertical: "Halfwayback FaceAngle",
  topFaceAngleToHorizontal:       "Top FaceAngle",
  downSwingShaftRotationMax:      "ShaftRotation Max",
  downSwingShaftRotationMin:      "ShaftRotation Min",
  impactGripSpeed:                "GripSpeed",
  impactClubPath:                 "ClubPath",
};
const UNIT: Record<string, string> = {
  addressHandFirst: "°", addressLieAngle: "°",
  halfwaydownFaceAngleToVertical: "°",
  halfwaybackFaceAngleToVertical: "°",
  topFaceAngleToHorizontal: "°",
  downSwingShaftRotationMax: "°/s",
  downSwingShaftRotationMin: "°/s",
  impactGripSpeed: "m/s",
  impactClubPath: "°",
};

/* ===================================================================== */
export default function SuccessBars({ swing, keys }: Props) {
  const rows = useMemo(() => {
    return keys.map((k) => {
      const now = Number(swing[k.feature] ?? 0);

      /* ---- 目標帯 (median ±5%) ---- */
      const minWidthRatio = 0.01; // 最低幅 ±1 %
      const bandHalf = Math.max(Math.abs(k.median * 0.10), Math.abs(k.median) * minWidthRatio);
      const tgtMin = k.median - bandHalf;
      const tgtMax = k.median + bandHalf;

      /* ---- スケール span：median を中央 ---- */
      const span = Math.max(Math.abs(now - k.median), bandHalf) * 1.6 || 1;
      const toPct = (v: number) => 50 + ((v - k.median) / span) * 50;

      return {
        ...k,
        now,
        tgtMin,
        tgtMax,
        bandLeft   : toPct(tgtMin),
        bandWidth  : toPct(tgtMax) - toPct(tgtMin),
        bandCenter : toPct(k.median),
        markLeft   : toPct(now),
        span,
      };
    });
  }, [keys, swing]);

  if (!rows.length) return null;

  return (
    <div className="bg-[#0e1524] rounded-lg pt-0 pb-3 px-3">
      <h3 className="text-base mb-1">
        成功スイングモデルへの寄与指標と目標値（緑の目標帯に揃うと完全スクエア・高飛距離が狙えます）
      </h3>

      <div className="space-y-0.5">
        {rows.map((r) => {
          const inBand = r.now >= r.tgtMin && r.now <= r.tgtMax;

/* === 目盛り (実数) ======================================= */
const maxDiff = Math.max(
  Math.abs(r.tgtMax - r.median),
  Math.abs(r.now - r.median)
);
const idealTickN = 21;                    // 中央を含め最大 11 本
const rawStep = 2;                        // 基本刻み 8
// 目盛り本数が多すぎる場合は step を倍々で増やす
let step = rawStep;
while (Math.ceil((maxDiff * 2) / step) > idealTickN) {
  step *= 2;                              // 8 → 16 → 32 → …
}
const range = Math.ceil(maxDiff / step) * step;
const start = r.median - range;
const end   = r.median + range;

const ticks: JSX.Element[] = [];
for (let v = start; v <= end; v += step) {
  const pct = 50 + ((v - r.median) / (range * 2)) * 100;
  ticks.push(
    <span
      key={v}
      className="absolute -top-5 -translate-x-1/2 text-[9px] text-gray-500 flex flex-col items-center"
      style={{ left: `${pct}%` }}
    >
      <span className="block w-px h-4 bg-gray-500/20" />
      <span className="mt-1">{v.toFixed(1)}</span>
    </span>
  );
}


          return (
            <div key={r.feature}>
{/* --- ラベル行：値を非表示にして左ラベルだけ --- */}
  <div className="mb-0.5">
    <span className="text-base text-gray-300 truncate">
      {LABEL[r.feature] ?? r.feature}
    </span>
  </div>

              {/* --- バー本体 ---------------------------------------------- */}
              <div className="relative h-4 bg-gray-700/30 rounded">

                {/* 目盛り & 数値 */}
                {ticks}

                {/* 中央ライン */}
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-500/40" />

                {/* 目標帯 */}
                <div
                  className="absolute h-full bg-emerald-600/70"
                  style={{ left: `${r.bandLeft}%`, width: `${r.bandWidth}%` }}
                />

                {/* 目標帯ラベル (median) */}
                <div
                  className="absolute -top-5 text-[11px] text-white font-nomal -translate-x-1/2"
                  style={{ left: `${r.bandCenter}%` }}
                >
                  {r.median.toFixed(1)}
                  {UNIT[r.feature] ?? ""}
                </div>

                {/* --- マーカーバッジ（ホームベース形） ------------------- */}
                <div
                  className={`absolute -top-6 text-[11px] font-nomal text-white
                               flex items-center justify-center
                               ${inBand ? "bg-emerald-500" : "bg-sky-600"}`}
                  style={{
                    left : `calc(${r.markLeft}% - 24px)`,
                    width: "30px",
                    height: "28px",
                    clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                  }}
                >
                  {r.now.toFixed(1)}
                  {UNIT[r.feature] ?? ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
