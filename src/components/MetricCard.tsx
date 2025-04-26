// src/components/MetricCard.tsx (ラベルと値の間の隙間調整)
"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

export default function MetricCard({
  label,
  value,
  unit,
}: MetricCardProps) {
  const isNumber = typeof value === 'number' && !isNaN(value);
  const display = isNumber ? value.toFixed(2) : String(value);
  const valueClass = "text-2xl"; // 常に大きなフォント
  const unitClass = isNumber ? "ml-1 text-2xl" : "";

  return (
    // --- ↓↓↓ justify-between を削除 ↓↓↓ ---
    <div className="flex-1 min-w-[120px] rounded-lg bg-card shadow-md px-4 py-1 flex flex-col min-h-[60px]">
    {/* --- ↑↑↑ justify-between を削除 ↑↑↑ --- */}
      {/* ラベル (項目名) */}
      <h2 className="text-white text-xs font-medium tracking-wide truncate" title={label}>
        {label}
      </h2>
      {/* 値＋単位 */}
      {/* --- ↓↓↓ mt-auto を削除し、mt-1 を追加 (または mt-0) ↓↓↓ --- */}
      <p className={`font-normal text-white font-oswald ${valueClass} mt-1`}>
      {/* --- ↑↑↑ mt-auto を削除し、mt-1 を追加 (または mt-0) ↑↑↑ --- */}
        {display}
        {isNumber && unit && (
          <span className={unitClass}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}