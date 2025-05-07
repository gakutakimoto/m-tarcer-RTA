"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface Props {
  path: [number, number, number][];
  duration?: number; // 秒（全体再生時間）
}

export default function AnimatedBall({ path, duration = 2 }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  // パスが変わったら再スタート
  useEffect(() => {
    startTime.current = null;
    console.log("POINTS:", path.length);
  }, [path]);

  useFrame((state) => {
    if (!ref.current || path.length === 0) return;

    // Three.js の内部クロックを使って経過時間を取得
    const now = state.clock.getElapsedTime();
    if (startTime.current === null) {
      startTime.current = now;
    }
    const elapsed = now - startTime.current;

    // t を [0, path.length-1] の範囲にマッピング
    const totalFrames = path.length;
    const t = (elapsed / duration) * (totalFrames - 1);

    // 整数部をインデックス、小数部を補間係数に
    const index = Math.floor(t);
    const alpha = t - index;

    // 最後まで到達したら最後の点に固定
    if (index >= totalFrames - 1) {
      const [lx, ly, lz] = path[totalFrames - 1];
      ref.current.position.set(lx, ly, lz);
      return;
    }

    // 2 点間を線形補間
    const [x1, y1, z1] = path[index];
    const [x2, y2, z2] = path[index + 1];
    const x = THREE.MathUtils.lerp(x1, x2, alpha);
    const y = THREE.MathUtils.lerp(y1, y2, alpha);
    const z = THREE.MathUtils.lerp(z1, z2, alpha);

    ref.current.position.set(x, y, z);
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}