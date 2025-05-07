// ClubBall.tsx
"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ClubBallProps {
  trajectoryPoints: THREE.Vector3[];
  isPlaying: boolean;
}

export default function ClubBall({ trajectoryPoints, isPlaying }: ClubBallProps) {
  const ref = useRef<THREE.Mesh>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now();
    }
  }, [isPlaying]);

  useFrame(() => {
    if (!ref.current || !isPlaying || trajectoryPoints.length === 0) return;

    const elapsed =
      startTimeRef.current !== null
        ? (performance.now() - startTimeRef.current) / 1000 // 秒
        : 0;

    const index = Math.floor(elapsed * 60); // 60fps 換算

    if (index >= trajectoryPoints.length) return;

    ref.current.position.copy(trajectoryPoints[index]);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  );
}
