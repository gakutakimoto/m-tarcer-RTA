// -----------------------------------------------------------------------------
// src/components/FairwayGuide.tsx   ★ シーン側の回転をそのまま継承する版 ★
// -----------------------------------------------------------------------------
"use client";
import * as THREE from "three";
import { Text } from "@react-three/drei";

interface Props {
  width: number;          // フェアウェイと同じ X サイズ
  depth: number;          // フェアウェイと同じ Z サイズ
  interval?: number;      // 何 yard ごとに線を引く？（既定 50y）
  y?: number;             // フェアウェイ表面より少し上げる高さ
}

export default function FairwayGuide({
  width,
  depth,
  interval = 50,
  y = 0,
}: Props) {
/* ---------- ガイド線の頂点を生成 ---------- */
const pts: number[] = [];
const labels: { z: number; text: string }[] = [];

/* 横線（Z 方向）*/
for (let z = 0; z <= depth; z += interval) {
  pts.push(-width / 2, y, z);   // 左端
  pts.push( width / 2, y, z);   // 右端
  if (z !== 0) labels.push({ z, text: `${z}y` });
}

/* ★ 縦線（X 方向）← ここを追加！ */
for (let x = -width / 2; x <= width / 2; x += interval) {
  pts.push(x, y, 0);            // 手前
  pts.push(x, y, depth);        // 奥
}

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));

  return (
    /* ★ rotation を外し、親 <group> の回転をそのまま継承 */
    <group>
      {/* ライン（半透明ホワイト） */}
      <lineSegments geometry={geom}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </lineSegments>

      {/* ラベル（Billboard Text） */}
      {labels.map(({ z, text }) => (
        <Text
        key={z}
        /* ❶ X: 右端より 1y 内側へ　❷ Y: もう少し浮かす (+0.12) */
        position={[width / 2 - 50, y + 2, z]}
        fontSize={2.5}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        rotation={[Math.PI, 0, Math.PI]}
        outlineColor="#001a0e"
        outlineWidth={0.05}
        >
          {text}
        </Text>
      ))}
    </group>
  );
}
// -----------------------------------------------------------------------------
/* 使い方（page.tsx の例）
   <FairwayGuide width={200} depth={300} y={-0.49} />
   フェアウェイと同じ group に入れる → 親 group の前傾回転だけがかかる
*/
// -----------------------------------------------------------------------------
