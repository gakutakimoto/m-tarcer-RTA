// src/components/SuccessCompareChart.tsx
"use client";

export default function SuccessCompareChart({
  swingId,
}: {
  swingId: string;
}) {
  return (
    <div className="flex items-center justify-center h-56 rounded-lg bg-[#1a2336] text-neutral-400">
      <span className="text-sm">
        成功スイング比較チャート（swingId: {swingId}）<br />
        ※あとで実装予定
      </span>
    </div>
  );
}
