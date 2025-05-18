"use client";

import { useState } from "react";
import Image from "next/image";

export default function FaceAngleTest() {
  const [angle, setAngle] = useState(0);          // ← スライダーで角度を操作
  const clubSrc = "/face/i-face.png";             // アイアン画像
  const bgSrc   = "/face/facebg.png";             // 分度器画像

  return (
    <div className="w-72 mx-auto rounded-lg bg-[#101624] p-4 space-y-4">
      <h4 className="text-center text-gray-200 font-semibold mb-2">
        フェース角テスト ({angle.toFixed(1)}°)
      </h4>

      {/* 画像ボックス：固定 1:1 */}
      <div className="relative w-full aspect-square">
        {/* 分度器：静止 */}
        <Image
          src={bgSrc}
          alt="分度器"
          fill
          className="object-contain pointer-events-none select-none"
          priority
        />

        {/* クラブ：回転 */}
        <Image
          src={clubSrc}
          alt="クラブ"
          fill
          className="object-contain pointer-events-none select-none"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 0.3s ease-out",
          }}
          priority
        />
      </div>

      {/* 角度スライダー */}
      <input
        type="range"
        min={-30}
        max={30}
        step={0.1}
        value={angle}
        onChange={(e) => setAngle(parseFloat(e.target.value))}
        className="w-full accent-pink-500"
      />
    </div>
  );
}
