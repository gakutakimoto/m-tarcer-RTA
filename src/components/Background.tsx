// -----------------------------------------------------------------------------
// src/components/Background.tsx
// 背景パネル（固定画像 PNG／JPG）
// -----------------------------------------------------------------------------
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 背景パネル
 * props:
 *   width  - 横幅 yard（デフォ 160）
 *   height - 高さ yard（デフォ 90）
 *   z      - カメラからの奥行き（デフォ 120 = 前方）
 */
export default function Background({
  width = 600,
  height = 300,
  z = 120,
}: {
  width?: number;
  height?: number;
  z?: number;
}) {
  // public/textures/bg.png を読み込む
  const tex = useLoader(THREE.TextureLoader, "/textures/bg2.png");
  tex.colorSpace = THREE.SRGBColorSpace; // 色が暗くならないように

  return (
    <mesh
      position={[0, height / 2 - 1, z]}  /* 少し下げて地面と合わせる */
      rotation={[0, Math.PI, 0]} 
    >
      {/* 横幅×高さ：画像アスペクトに合わせて調整 */}
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}
