"use client";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

/**
 * FairwayGround – 1 枚物フェアウェイを自由サイズで配置
 *
 * @prop width    X 方向の長さ (yard)   デフォ 120
 * @prop depth    Z 方向の長さ (yard)   デフォ 300
 * @prop offsetZ  plane を奥へずらす量  デフォ 0  ←★new
 * @prop y        高さオフセット        デフォ 0
 *
 * 原点(0,0,0) から見て「手前端 = 0」になるように配置し、
 * offsetZ を与えるとそのぶんだけ奥へスライドできる。
 */
interface Props {
  width?: number;
  depth?: number;
  offsetZ?: number;
  y?: number;
}

export default function FairwayGround({
  width = 120,
  depth = 300,
  offsetZ = 0,
  y = 0,
}: Props) {
  const tex = useLoader(THREE.TextureLoader, "/textures/grass2.png");
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;

  /* plane 中心 = depth/2 奥。その後さらに offsetZ 奥へ */
  const zPos = depth / 2 - offsetZ;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, zPos]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  );
}