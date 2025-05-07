"use client";

import React from "react";
import * as THREE from "three";
import { useMemo } from "react";

export default function TrajectoryTest() {
  // ✅ ダミーデータ（本物の取得値と同じ）
  const estimateCarry = 122.84;
  const impactAttackAngle = -10.92;
  const impactFaceAngle = 1.57;
  const impactRelativeFaceAngle = 20.18;

  const launchAngleRad = (impactAttackAngle * Math.PI) / 180;
  const faceAngleRad = (impactFaceAngle * Math.PI) / 180;
  const relFaceAngleRad = (impactRelativeFaceAngle * Math.PI) / 180;

  const totalTime = 2.0;
  const totalSteps = 100;
  const velocity = estimateCarry / totalTime;

  // 🚀 軌道計算（useMemoでメモ化）
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      const t = (i / totalSteps) * totalTime;
      const z = velocity * t * Math.cos(launchAngleRad);
      const y = velocity * t * Math.sin(launchAngleRad) - 0.5 * 9.8 * t * t;
      const x = velocity * t * (Math.sin(faceAngleRad) + 0.3 * Math.sin(relFaceAngleRad) * (t / totalTime));

      arr.push(new THREE.Vector3(x, y, z));
    }
    return arr;
  }, []);

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
  const material = new THREE.MeshBasicMaterial({ color: "aqua" });

  return <mesh geometry={geometry} material={material} />;
}
