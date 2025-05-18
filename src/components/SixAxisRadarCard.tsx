// -----------------------------------------------------------------------------
// components/SixAxisRadarCard.tsx
//   正方形カード：幅 = 高さ（aspect-square）で余白ゼロ表示
// -----------------------------------------------------------------------------
"use client";

import SixAxisRadar from "@/components/SixAxisRadar";
import { SixAxis }  from "@/utils/calcSixAxisScore";

type Props = {
  swing: Record<SixAxis, number>;
  clubType: "D" | "I";
};

export default function SixAxisRadarCard({ swing, clubType }: Props) {
  return (
    /* width を決めれば高さは自動で同じ (aspect-square) */
    <div className="relative w-[150px] aspect-square rounded-lg bg-[#0e1524] overflow-visible">
      {/* レーダーをカード全面にフィットさせる */}
      <SixAxisRadar
        swing={swing}
        clubType={clubType}
        outerRadiusPct={80} /* 円をギリギリまで拡大 */
        marginPx={4}        /* ラベル用 4px だけ余白 */
      />
    </div>
  );
}
// -----------------------------------------------------------------------------
