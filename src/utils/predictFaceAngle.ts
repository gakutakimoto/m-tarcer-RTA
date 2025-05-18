// -----------------------------------------------------------------------------
// src/utils/predictFaceAngle.ts
//   – フェース角予測 (degree)  2025-05-13 更新係数
// -----------------------------------------------------------------------------
export interface InputForFA {
  halfwaydownFaceAngleToVertical: number; // HD
  impactLieAngle: number;                // impactLieAngle
  addressLieAngle: number;               // addressLieAngle
  HandFirstDeg: number;                  // HandFirst (先行＝−, 遅れ＝＋) [deg]
  downSwingShaftRotationMax: number;     // for SRΔ
  downSwingShaftRotationMin: number;     // for SRΔ
  topFaceAngleToHorizontal: number;      // for ClosureAngle
}

/** 係数は Colab 回帰 (MAE≈3.96°, R²≈0.742) に基づく */
export function predictFaceAngle({
  halfwaydownFaceAngleToVertical: HD,
  impactLieAngle,
  addressLieAngle,
  HandFirstDeg: HandFirst,
  downSwingShaftRotationMax,
  downSwingShaftRotationMin,
  topFaceAngleToHorizontal,
}: InputForFA): number {
  // Δ計算
  const LieDelta     = impactLieAngle - addressLieAngle;
  const SRDelta      = downSwingShaftRotationMax - downSwingShaftRotationMin;
  const ClosureAngle = topFaceAngleToHorizontal - HD;

  // 回帰式
  return (
    1.5413 +
    0.13   * HD +
    0.4352 * LieDelta +
   -0.6471 * HandFirst +
   -0.0021 * SRDelta +
    0.0069 * ClosureAngle
  );
}
