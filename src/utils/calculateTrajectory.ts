// src/utils/calculateTrajectory.ts
import * as THREE from "three";

/**
 * SwingParams — 必要最低限 + D‑Plane / ギア効果用カラム
 */
export interface SwingParams {
  clubType: "D" | "I";           // ドライバー or アイアン
  estimateCarry: number;           // 推定キャリー (yard)
  impactAttackAngle: number;       // アタック角 (deg)
  impactFaceAngle: number;         // フェース角 (deg)
  impactClubPath: number;          // クラブパス (deg)
  impactPointY?: number | null;    // 打点上下ズレ (cm)
  impactPointX?: number | null;    // 打点左右ズレ (cm) ← ギア効果
}

/*────────────────────────── D‑Plane 補助関数 ─────────────────────────*/
// ① 出球方向 (Horizontal Launch Angle)
function getHorizontalLaunch(face: number, path: number, club: "D" | "I") {
  const faceRatio = club === "D" ? 0.85 : 0.8;      // Driver 85%, Iron 80%
  return face * faceRatio + path * (1 - faceRatio);   // +右, -左 (deg)
}

// ② スピン軸傾き (Spin Axis) + ギア効果
function getSpinAxis(face: number, path: number, vLaunch: number, impactX: number | null, club: "D" | "I") {
  let sa = 0.7 * (face - path) * Math.cos(vLaunch * Math.PI / 180);  // 基本D‑Plane
  if (club === "D" && impactX != null) {
    const gearCoeff = 3.0;               // 調整値: 1 cmで≈3°傾き
    sa -= gearCoeff * impactX;           // +X(トウ)=左曲げ, -X(ヒール)=右曲げ
  }
  return sa; // +右フェード, -左ドロー
}

/*────────────────────────── 高さ / トップダフリ補正 ─────────────────────────*/
function applyImpactPointPenalty(carry: number, height: number, impactPointY?: number | null) {
  if (impactPointY == null) return { carry, height };
  if (impactPointY < -1.633) return { carry: carry * 0.85, height: height * 0.5 }; // トップ気味
  if (impactPointY > 2.172) return { carry: carry * 0.75, height: height * 0.6 }; // ダフリ気味
  return { carry, height };
}

/*────────────────────────── 打ち出し角 (ロフト + AoA) ─────────────────────────*/
function getLaunchAngle(club: "D" | "I", aoa: number): number {
  if (club === "D") return 10 + aoa * 0.5;          // Driver 基準ロフト10°
  const baseLoft = 34;                                // 7I 相当
  return aoa >= -7 && aoa <= -1 ? baseLoft : baseLoft - 6;
}

/*────────────────────────── メイン: 軌道点生成 ─────────────────────────*/
export function generateTrajectoryPoints(params: SwingParams, step: number = 1 / 60) {
  const ydToM = 0.9144;
  const { clubType, estimateCarry, impactAttackAngle, impactFaceAngle, impactClubPath, impactPointY, impactPointX } = params;

  /*--- 打ち出し角 & 初速逆算 (空気抵抗無視) ---*/
  const launchDeg = getLaunchAngle(clubType, impactAttackAngle);
  const launchRad = launchDeg * Math.PI / 180;
  const g = 9.80665;
  const rangeM = estimateCarry * ydToM;
  const v0 = Math.sqrt((rangeM * g) / Math.max(Math.sin(2 * launchRad), 0.001));

  /*--- D‑Plane 計算 ---*/
  const hLaunch = getHorizontalLaunch(impactFaceAngle, impactClubPath, clubType); // deg
  const dirYaw = hLaunch * Math.PI / 180;
  const spinAxis = getSpinAxis(impactFaceAngle, impactClubPath, launchDeg, impactPointX ?? null, clubType);
  const bendDir = spinAxis >= 0 ? 1 : -1;
  const bendAmount = Math.abs(spinAxis) * 0.01; // k=0.01 体感係数

  /*--- トップ/ダフリ補正 ---*/
  const baseMaxH = (v0 * Math.sin(launchRad)) ** 2 / (2 * g);
  const { carry: adjRange, height: adjMaxH } = applyImpactPointPenalty(rangeM, baseMaxH, impactPointY);

  /*--- サンプリング ---*/
  const totalT = (2 * v0 * Math.sin(launchRad)) / g;
  const pts: THREE.Vector3[] = [];
  for (let t = 0; t <= totalT; t += step) {
    const x0 = v0 * Math.cos(launchRad) * t;
    const y0 = v0 * Math.sin(launchRad) * t - 0.5 * g * t * t;

    const prog = x0 / rangeM;
    const height = (y0 / baseMaxH) * adjMaxH;
    const forward = prog * adjRange;
    const lateral = bendAmount * forward * prog * bendDir;

    const worldX = forward * Math.cos(dirYaw) - lateral * Math.sin(dirYaw);
    const worldZ = forward * Math.sin(dirYaw) + lateral * Math.cos(dirYaw);
    pts.push(new THREE.Vector3(worldX, height, worldZ));
  }
  return pts;
}
