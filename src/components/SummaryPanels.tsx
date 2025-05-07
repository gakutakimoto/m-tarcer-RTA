// src/components/SummaryPanels.tsx
"use client";

import DynamicFacePanel    from "@/components/DynamicFacePanel";
import DynamicAttackPanel  from "@/components/DynamicAttackPanel";
import ImpactPointPanel    from "@/components/ImpactPointPanel";

export default function SummaryPanels({
  clubType,
  faceAngle,
  loftAngle,          /* ★ 名前を loftAngle に */
  pointX,
  pointY,
  advice,
}: {
  clubType: "D" | "I";
  faceAngle: number;
  loftAngle: number;       // impactLoftAngle を渡す
  pointX: number | null;
  pointY: number | null;
  advice: string | null;
}) {
  return (
    <div className="w-full rounded-lg bg-[#101624] p-2">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-1">
        {/* ① フェース角（回転式） */}
        <DynamicFacePanel clubType={clubType} faceAngle={faceAngle} />

        {/* ② アタック角（loftAngle で回転式） */}
        <DynamicAttackPanel clubType={clubType} loftAngle={loftAngle} />

        {/* ③ ミートポイント */}
        <ImpactPointPanel
          clubType={clubType}
          pointX={pointX}
          pointY={pointY}
        />

        {/* ④ アドバイス */}
        <div className="rounded-md bg-[#0e1524] flex flex-col md:col-span-3 md:row-start-2">
          <h3 className="px-3 py-2 text-sm font-semibold text-gray-200">
            M-tracerアドバイス
          </h3>
          <div className="flex-1 p-3 text-sm leading-relaxed text-gray-300 overflow-y-auto">
            {advice ?? "ここに AI のアドバイスを表示します。"}
          </div>
        </div>
      </section>
    </div>
  );
}
