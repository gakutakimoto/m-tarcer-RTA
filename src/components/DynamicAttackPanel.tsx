// src/components/DynamicAttackPanel.tsx
"use client";

import Image from "next/image";

type Props = {
  clubType: "D" | "I";
  loftAngle: number;            // impactLoftAngle (°) を受け取る
};

/**
 * アタックアングル (ロフト角) パネル
 *   +loftAngle → 反時計回り（左回転）
 *   -loftAngle → 時計回り   （右回転）
 * ⇒ CSS の正方向（時計回り）と逆なので  -loftAngle で回す
 */
export default function DynamicAttackPanel({ clubType, loftAngle }: Props) {
  const clubSrc =
    clubType === "D" ? "/face/da-face.png" : "/face/ia-face.png";
  const bgSrc = "/face/facebg.png";

  /** 正方向を反転させる */
  const visualAngle = -loftAngle;

  return (
    <div className="rounded-md overflow-hidden bg-[#0e1524]">
      <h3 className="px-3 py-1 text-sm font-semibold text-gray-200 text-center">
        インパクトロフト
      </h3>

      <div className="relative w-full pt-[100%]">
        {/* 分度器（静止） */}
        <Image
          src={bgSrc}
          alt="分度器"
          fill
          className="object-contain pointer-events-none select-none"
          priority
        />

        {/* クラブ（回転） */}
        <Image
          src={clubSrc}
          alt="クラブアタック角"
          fill
          className="object-contain pointer-events-none select-none"
          style={{
            transform: `rotate(${visualAngle}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 0.3s ease-out",
          }}
          priority
        />
      </div>
    </div>
  );
}
