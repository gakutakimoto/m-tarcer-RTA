"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from 'meshline';  // ← こっちに変える
import { extend } from '@react-three/fiber';

// three-fiber に MeshLine / MeshLineMaterial を登録
extend({ MeshLine, MeshLineMaterial });

interface CustomMeshLineProps {
  points: [number, number, number][];
  color?: string;
  lineWidth?: number;
  opacity?: number;
}

export default function CustomMeshLine({
  points,
  color = 'white',
  lineWidth = 0.05,
  opacity = 0.5,
}: CustomMeshLineProps) {
  // [number,number,number] の配列を THREE.Vector3 配列に落とし込む
  const validPoints = useMemo(() => {
    return points
      .filter(p =>
        Array.isArray(p) &&
        p.length === 3 &&
        p.every(n => Number.isFinite(n))
      )
      .map(p => new THREE.Vector3(p[0], p[1], p[2]));
  }, [points]);

  // MeshLine のインスタンスを作成
  const line = useMemo(() => {
    const ml = new MeshLine();

    if (validPoints.length >= 2) {
      ml.setPoints(validPoints);
    } else if (validPoints.length === 1) {
      // 1点しかなければ同じ点を2回渡す
      ml.setPoints([ validPoints[0], validPoints[0] ]);
    } else {
      // 0点なら原点を2つ渡してクラッシュ回避
      const fallback = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ];
      ml.setPoints(fallback);
    }

    return ml;
  }, [validPoints]);

  return (
    <mesh>
      {/* geometry として MeshLine を流し込む */}
      <primitive attach="geometry" object={line} />
      {/* material は three-fiber の extend で認識させた <meshLineMaterial> */}
      <meshLineMaterial
        attach="material"
        transparent
        depthTest={false}
        lineWidth={lineWidth}
        color={new THREE.Color(color)}
        opacity={opacity}
      />
    </mesh>
  );
}
