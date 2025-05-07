// src/components/AttackImagePicker.tsx
"use client";

import Image from "next/image";

type Props = {
  /** "D" = Driver, "I" = Iron */
  clubType: "D" | "I";
  /** impactAttackAngle [°] : ＋アッパー / −ダウン */
  attackAngle: number;
};

/**
 * アタック角に応じて画像を出し分ける
 *   D: d-up / d-down
 *   I: i-up / i-down
 */
export default function AttackImagePicker({ clubType, attackAngle }: Props) {
  const suffix = attackAngle >= 0 ? "up" : "down";
  const src = `/face/${clubType.toLowerCase()}-${suffix}.png`;
  const alt = `アタック角 ${suffix}`;

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
