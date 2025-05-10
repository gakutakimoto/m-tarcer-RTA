// -----------------------------------------------------------------------------
// src/components/TrajectoryWithBall.tsx
// 2 バウンド + ロール（追加距離 = キャリーの 15 % 以内）
// ─ 転がり方向はフライト終端の接線方向！
// -----------------------------------------------------------------------------
"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dPlaneTrajectory } from "@/utils/dPlaneTrajectory";

/* ===== 調整パラメータ ===== */
const REST_SECONDS = 2;        // ループ前の待機
const EXTRA_RATIO  = 0.15;     // バウンド+ロールの全追加距離
const HEIGHT_RATIO = 0.25;     // 1回目バウンド高さ = tan(AoA) * carry * 0.25
const DIST_RATIO1  = 0.06;     // 1回目バウンド横距離 / carry
const DIST_RATIO2  = 0.04;     // 2回目バウンド横距離 / carry
// ※ DIST_RATIO1 + DIST_RATIO2 < EXTRA_RATIO を必ず満たすこと

/* ===== Props ===== */
export type TrajectoryProps = {
  estimateCarry: number;
  impactAttackAngle: number;
  impactFaceAngle: number;
  impactClubPath: number;
  clubType: "D" | "I";
  impactLoftAngle: number | null;
};

export default function TrajectoryWithBall(props: TrajectoryProps) {
  /* ---------- ① 基本フライト点列 ---------- */
  const flightPts = useMemo(
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

  /* ---------- ② 軌道終端の接線方向 ---------- */
  const tangentDir = useMemo(() => {
    if (flightPts.length < 2) return new THREE.Vector2(1, 0); // 保険
    const v = flightPts[flightPts.length - 1]
      .clone()
      .sub(flightPts[flightPts.length - 2]);
    return new THREE.Vector2(v.x, v.z).normalize();
  }, [flightPts]);

  /* ---------- ③ 追加距離・パラメータ ---------- */
  const extraTotal = props.estimateCarry * EXTRA_RATIO;

  /* =================================================================== */
  /* 1回目バウンド                                                       */
  /* =================================================================== */
/* =================================================================== */
/* ① 1回目バウンド                                                    */
/* =================================================================== */
const p0 = flightPts[flightPts.length - 1]; // 着地点

// ──★〈変更ポイント〉───────────────────────────────────────
const MIN_BOUNCE_H = 0.3; // ← 最低 30 cm — 好みで 0.2 とかに下げてもOK

let h1 =
  Math.tan((props.impactAttackAngle * Math.PI) / 180) *
  props.estimateCarry *
  HEIGHT_RATIO;
h1 = Math.max(h1, MIN_BOUNCE_H); // ★ クランプ！
// ────────────────────────────────────────────────────────

const d1 = props.estimateCarry * DIST_RATIO1;

const p1peak = p0
  .clone()
  .add(new THREE.Vector3(tangentDir.x * d1 * 0.5, h1, tangentDir.y * d1 * 0.5));
const p1end = p0
  .clone()
  .add(new THREE.Vector3(tangentDir.x * d1, 0, tangentDir.y * d1));

/* ★ 保険で “必ず地面以上” にしておく */
[p1peak, p1end].forEach(p => (p.y = Math.max(p.y, 0)));

const bounce1 = new THREE.QuadraticBezierCurve3(
  p0,
  p1peak,
  p1end
).getPoints(20);


  /* =================================================================== */
  /* 2回目バウンド                                                       */
  /* =================================================================== */
  const h2 = h1 * 0.5; // 半減
  const d2 = props.estimateCarry * DIST_RATIO2;

  const p2peak = p1end
    .clone()
    .add(
      new THREE.Vector3(tangentDir.x * d2 * 0.5, h2, tangentDir.y * d2 * 0.5)
    );
  const p2end = p1end
    .clone()
    .add(new THREE.Vector3(tangentDir.x * d2, 0, tangentDir.y * d2));

  const bounce2 = new THREE.QuadraticBezierCurve3(p1end, p2peak, p2end).getPoints(
    15
  );

  /* =================================================================== */
  /* ロール                                                              */
  /* =================================================================== */
  const rollDist = extraTotal - d1 - d2;
  const p3end = p2end
    .clone()
    .add(new THREE.Vector3(tangentDir.x * rollDist, 0, tangentDir.y * rollDist));

  const rollPts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const seg = 30;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const progress = 1 - (1 - t) * (1 - t); // ease-out
      pts.push(
        new THREE.Vector3(
          p2end.x + (p3end.x - p2end.x) * progress,
          0,
          p2end.z + (p3end.z - p2end.z) * progress
        )
      );
    }
    return pts;
  }, [p2end, p3end]);

  /* =================================================================== */
  /* チューブ & ボール                                                   */
  /* =================================================================== */
  const allPts = [...flightPts, ...bounce1, ...bounce2, ...rollPts];
  const curve = useMemo(() => new THREE.CatmullRomCurve3(allPts), [allPts]);

  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 300, 0.3, 8, false),
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

  /* ------------------ アニメーション ------------------ */
  const ballRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const totalTime = useMemo(() => allPts.length * 0.02, [allPts]);

  useEffect(() => {
    timeRef.current = 0;
    ballRef.current?.position.copy(allPts[0]);
  }, [allPts]);

  useFrame((_, delta) => {
    if (!ballRef.current) return;
    timeRef.current += delta;
    const loop = totalTime + REST_SECONDS;
    if (timeRef.current >= loop) timeRef.current -= loop;

    const t = Math.min(timeRef.current / totalTime, 1);
    ballRef.current.position.copy(curve.getPoint(t));
  });

  /* ------------------ 描画 ------------------ */
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
