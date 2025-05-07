"use client";

import React, { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { generateTrajectoryPoints, SwingParams } from "@/utils/calculateTrajectory";

/** 太線を返すコンポーネント */
export default function TrajectoryLine(props: SwingParams) {
  const { size } = useThree();

  /** points 生成 → Vector3[] */
  const vecPoints = useMemo(() => generateTrajectoryPoints(props, 1 / 60), [props]);

  /** geometry & material をメモ化 */
  const { geo, mat } = useMemo(() => {
    const g = new LineGeometry();
    g.setPositions(vecPoints.flatMap((p) => [p.x, p.y, p.z]));
    g.computeBoundingSphere();
    g.computeLineDistances();

    const m = new LineMaterial({
      color: 0xffffff,
      linewidth: 0.02,   // 軸スケール依存 (0.02 = 2cm 相当)
      transparent: false,
      opacity: 1,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, [vecPoints]);

  /** 解像度は毎フレーム更新が安全 */
  useEffect(() => {
    mat.resolution.set(size.width, size.height);
  }, [size, mat]);

  // 1点以下なら描かない
  if (vecPoints.length < 2) return null;

  // @ts-ignore <line2> は JSX で認識されないので ignore
  return <line2 geometry={geo} material={mat} />;
}
