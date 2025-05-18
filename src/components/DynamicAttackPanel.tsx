// -----------------------------------------------------------------------------
// src/components/DynamicAttackPanel.tsx
//   インパクトロフト（アタックアングル）ダイヤル
//   ★ <h3> の上余白を増やしてラベル切れ解消
// -----------------------------------------------------------------------------
"use client";

import Image from "next/image";

type Props = {
  clubType: "D" | "I";
  /** impactLoftAngle (°) を受け取る */
  loftAngle: number;
};

/**
 * アタックアングル (ロフト角) パネル
 *   +loftAngle → 反時計回り（左回転）
 *   -loftAngle → 時計回り（右回転）
 * ⇒ CSS の正方向（時計回り）と逆なので -loftAngle で回す
 */
export default function DynamicAttackPanel({ clubType, loftAngle }: Props) {
  const clubSrc = clubType === "D" ? "/face/da-face.png" : "/face/ia-face.png";
  const bgSrc   = "/face/facebg.png";

  /** 正方向を反転させる */
  const visualAngle = -loftAngle;

  return (
    <div className="rounded-md overflow-hidden bg-[#0e1524]">
      {/* ===== ラベル ===== */}
      <h3 className="px-3 pt-2 pb-1 text-sm font-semibold text-gray-200 text-center">
        インパクトロフト
      </h3>

      {/* ===== 画像ボックス：1:1 ===== */}
      <div className="relative w-full aspect-square">
        {/* 分度器（静止） */}
        <Image
          src={bgSrc}
          alt="分度器"
          fill
          priority
          className="object-contain pointer-events-none select-none"
        />

        {/* クラブ（回転） */}
        <Image
          src={clubSrc}
          alt="クラブアタック角"
          fill
          priority
          className="object-contain pointer-events-none select-none"
          style={{
            transform: `rotate(${visualAngle}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 0.3s ease-out",
          }}
        />
      </div>
    </div>
  );
}
// -----------------------------------------------------------------------------
