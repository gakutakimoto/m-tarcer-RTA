// src/components/FaceImagePicker.tsx
"use client";

import Image from "next/image";

type Props = {
  /** "D" = Driver, "I" = Iron */
  clubType: "D" | "I";
  /** impactFaceAngle [°] : ＋オープン / −クローズ */
  faceAngle: number;
};

/**
 * フェース角に応じて画像を出し分ける
 *   D: d-open / d-middle / d-close
 *   I: i-open / i-middle / i-close
 */
export default function FaceImagePicker({ clubType, faceAngle }: Props) {
  // 角度 → サフィックス判定
  const suffix =
    faceAngle >= 3 ? "open" : faceAngle <= -3 ? "close" : "middle";

  const src = `/face/${clubType.toLowerCase()}-${suffix}.png`;
  const alt = `フェース角 ${suffix}`;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width:768px)100vw,33vw"
      priority
    />
  );
}
