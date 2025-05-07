"use client";

import Image from "next/image";

type Props = {
  clubType: "D" | "I";
  faceAngle: number;      // impactFaceAngle (°)
};

/** フェース角を連続回転で可視化するパネル */
export default function DynamicFacePanel({ clubType, faceAngle }: Props) {
  // クラブ画像を種別で切替
  const clubSrc =
    clubType === "D" ? "/face/d-face.png" : "/face/i-face.png";
  const bgSrc = "/face/facebg.png"; // 分度器

  return (
    <div className="rounded-md overflow-hidden bg-[#0e1524]">
      <h3 className="px-3 py-1 text-sm font-semibold text-gray-200 text-center">
        フェースアングル
      </h3>

      {/* 画像ボックス：1:1 */}
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
          alt="クラブフェース"
          fill
          className="object-contain pointer-events-none select-none"
          style={{
            transform: `rotate(${faceAngle}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 0.3s ease-out",
          }}
          priority
        />
      </div>
    </div>
  );
}
