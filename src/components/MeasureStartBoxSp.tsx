// -----------------------------------------------------------------------------
// components/MeasureStartBoxSp.tsx
//   センサー取得値 4×2 グリッド  ─ 半透明オーバーレイ版
// -----------------------------------------------------------------------------
"use client";

import React from "react";

/* ---------- props 型 ---------- */
type SwingLike = {
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number | null;
  impactClubPath: number;
  impactRelativeFaceAngle: number | null;
  impactPointX: number | null;
  impactPointY: number | null;
};

interface Props {
  swing: SwingLike;
  headSpeed: number | null;
}

/* ---------- 本体 ---------- */
export default function MeasureStartBoxSp({ swing, headSpeed }: Props) {
  const metrics = [
    { label: "推定飛距離", value: swing.estimateCarry, unit: "yd" },
    { label: "ヘッドスピード", value: headSpeed, unit: "m/s" },
    { label: "フェース角", value: swing.impactFaceAngle, unit: "°" },
    { label: "アタック角", value: swing.impactAttackAngle, unit: "°" },
    { label: "ロフト角", value: swing.impactLoftAngle, unit: "°" },
    { label: "クラブパス", value: swing.impactClubPath, unit: "°" },
    { label: "フェーストゥパス", value: swing.impactRelativeFaceAngle, unit: "°" },
    { label: "ミート点(縦)", value: swing.impactPointY, unit: "cm" },
  ];

  return (
    <div
      className="
        absolute top-1.5 left-1/2 -translate-x-1/2 z-30
        w-[min(90vw,420px)]      /* ← モバイルで少し広げても OK */
        px-2.5 py-3 rounded-md     /* ← px を 4 にして左右余白を増やす */
        bg-[#0e1524]/35 backdrop-blur-sm
        text-white
      "
    >


      <div className="grid grid-cols-4 gap-x-4 gap-y-4">
        {metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 1 セル ---------- */
function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
}) {
  const txt =
    value !== null && value !== undefined
      ? value.toFixed(2).replace(/\.00$/, "")
      : "–";

  return (
    <div className="min-w-0 flex flex-col items-center text-center">
      <span className="text-[10px] font-semibold text-white leading-none truncate">{label}</span>

      <span className="text-4xl font-nomal whitespace-nowrap leading-none mt-1">
        {txt}
        {unit && <span className="text-base ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
// -----------------------------------------------------------------------------
