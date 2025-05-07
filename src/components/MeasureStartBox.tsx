// -----------------------------------------------------------------------------
// components/MeasureStartBox.tsx   ― 主要指標 4×2 グリッド
// -----------------------------------------------------------------------------
"use client";

import React from "react";

/* ======= props 型 ======= */
type SwingLike = {
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number | null;
  impactClubPath: number;
  impactRelativeFaceAngle: number | null;
  impactPointX: number | null;
  impactPointY: number | null;   // ← ★ 追加（Y 値）
};

interface Props {
  swing: SwingLike;
  headSpeed: number | null;
}

/* ======= 本体 ======= */
export default function MeasureStartBox({ swing, headSpeed }: Props) {
  const metrics = [
    { label: "推定飛距離", value: swing.estimateCarry, unit: "yd" },
    { label: "ヘッドスピード", value: headSpeed, unit: "m/s" },
    { label: "フェース角", value: swing.impactFaceAngle, unit: "°" },
    { label: "アタック角", value: swing.impactAttackAngle, unit: "°" },
    { label: "ロフト角", value: swing.impactLoftAngle, unit: "°" },
    { label: "クラブパス", value: swing.impactClubPath, unit: "°" },
    { label: "フェーストゥパス", value: swing.impactRelativeFaceAngle, unit: "°" },
    // ★ ここを impactPointY に変更
    { label: "ミート点(縦/中心比較)", value: swing.impactPointY, unit: "cm" },
  ];

  return (
    <div className="w-full rounded-lg bg-[#101624] p-2">
      <h4 className="text-sm font-bold text-gray-300 mb-4">センサー取得数値</h4>

      {/* min-w-0 で余計な横はみ出しを防止 */}
      <div className="grid grid-cols-4 gap-x-8 gap-y-2">
        {metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}

/* ======= 1 セル：ラベル上 / 値下 ======= */
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
      {/* ラベル */}
      <span className="text-sm font-bold text-gray-300 truncate">{label}</span>

      {/* 値＋単位 */}
      <span className="text-4xl font-nomal text-white whitespace-nowrap">
        {txt}
        {unit && (
          <span className="text-xl ml-0.5 whitespace-nowrap">{unit}</span>
        )}
      </span>
    </div>
  );
}
// -----------------------------------------------------------------------------
