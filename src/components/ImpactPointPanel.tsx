// src/components/ImpactPointPanel.tsx
"use client";

import Image from "next/image";

/* ================== 調整用定数 ================== */
const PX_PER_CM_X = 12;   // 横：1 cm → 22 px
const PX_PER_CM_Y = 10;   // 縦：1 cm → 22 px
const OFFSET_X_PX = 0;    // 原点調整（左右）
const OFFSET_Y_PX = 0;    // 原点調整（上下）
/* ================================================= */

type Props = {
  clubType: "D" | "I";   // ★ ドライバー or アイアン
  pointX: number | null; // ヒール側− / トゥ側＋ [cm]
  pointY: number | null; // ダウン側− / アップ側＋ [cm]
};

export default function ImpactPointPanel({ clubType, pointX, pointY }: Props) {
  /* 種別でセンター画像を切替 */
  const FACE_IMG = `/face/${clubType.toLowerCase()}-center.png`;

  /* 中央 0,0 → px */
  const dx = -(pointX ?? 0) * PX_PER_CM_X + OFFSET_X_PX; // 右が＋
  const dy = -(pointY ?? 0) * PX_PER_CM_Y + OFFSET_Y_PX; // 下が＋

  return (
    <div className="rounded-md overflow-hidden bg-[#0e1524]">
      <h3 className="px-3 py-1 text-sm font-semibold text-gray-200 text-center">
        ミートポイント
      </h3>

      <div className="relative w-full pt-[100%]">
        <Image
          src={FACE_IMG}
          alt="クラブフェース中心"
          fill
          className="object-contain"
          sizes="(max-width:768px)100vw,33vw"
          priority
        />

        {/* ぼかしマーカー */}
        <span
          className="absolute w-6 h-6 md:w-7 md:h-7 rounded-full bg-red-700/65 
                     shadow-[0_0_12px_12px_rgba(178,34,34,0.55)]"
          style={{
            left: `calc(50% + ${dx}px)`,
            top:  `calc(50% + ${dy}px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}
