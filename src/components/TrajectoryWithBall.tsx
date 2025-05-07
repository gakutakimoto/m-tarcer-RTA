// -----------------------------------------------------------------------------
// src/components/TrajectoryWithBall.tsx
// 役割：軌道チューブ＋ボールだけを描画（Canvas は外部）
// -----------------------------------------------------------------------------
"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dPlaneTrajectory } from "@/utils/dPlaneTrajectory";

/* ========================== Props ========================== */
export type TrajectoryProps = {
  estimateCarry: number;
  impactAttackAngle: number;
  impactFaceAngle: number;
  impactClubPath: number;
  clubType: "D" | "I";
  impactLoftAngle: number | null;
};

/* ====================== Component ========================== */
export default function TrajectoryWithBall(props: TrajectoryProps) {
  /* ① 軌道点を計算 */
  const points = useMemo(
    () =>
      dPlaneTrajectory(
        props.estimateCarry,
        props.impactAttackAngle,
        props.impactFaceAngle,
        props.impactClubPath,
        props.clubType,
        props.impactLoftAngle
      ),
    [props]
  );

  /* ② 曲線 & チューブ */
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 120, 0.3, 8, false),
    [curve]
  );
  const tubeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.35,
      }),
    []
  );

  /* ③ ボール移動制御（休憩 2 秒入り連続ループ） */
  const REST_SECONDS = 2; // ← 休憩時間をここで調整
  const ballRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const totalTime = useMemo(
    () => (points.length - 1) * 0.02,
    [points]
  );

  /* props 更新時リセット */
  useEffect(() => {
    timeRef.current = 0;
    ballRef.current?.position.copy(points[0]);
  }, [points]);

  useFrame((_, delta) => {
    if (!ballRef.current) return;

    timeRef.current += delta;
    const loopLen = totalTime + REST_SECONDS;
    if (timeRef.current >= loopLen) timeRef.current -= loopLen;

    if (timeRef.current <= totalTime) {
      const t = timeRef.current / totalTime;
      ballRef.current.position.copy(curve.getPoint(t));
    }
  });

  /* ④ 描画 */
  return (
    <>
      <mesh geometry={tubeGeo} material={tubeMat} />

      <mesh ref={ballRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3}
        />
      </mesh>
    </>
  );
}
// -----------------------------------------------------------------------------
