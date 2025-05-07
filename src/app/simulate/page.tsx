// -----------------------------------------------------------------------------
// src/app/simulate/page.tsx   ※ポッチ座標を SummaryPanels に渡すだけの更新
// -----------------------------------------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Image from "next/image";

import Header from "@/components/Header";
import Background from "@/components/Background";
import FairwayGround from "@/components/FairwayGround";
import FairwayGuide from "@/components/FairwayGuide";
import TrajectoryWithBall from "@/components/TrajectoryWithBall";
import MeasureStartBox from "@/components/MeasureStartBox";
import SummaryPanels from "@/components/SummaryPanels";   // ← ここは既に import 済み

import clusters from "@/data/clusters.json";
import tracerLogo from "@/images/logo.png";
import FaceAngleTest from "@/components/FaceAngleTest";


/* ============================== 型定義 ============================== */
interface RandomSwingApi {
  swing_cluster_unified: number | null;
  clubType: "D" | "I";
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number | null;
  impactClubPath: number;
  impactRelativeFaceAngle: number | null;
  impactPointX: number | null;   // ← 取得済み
  impactPointY: number | null;   // ← 取得済み
}

/* ========================== カメラ初期化 ============================ */
function CameraSetup() {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 8, -50);
    camera.lookAt(0, 1, 120);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/* ==================== ① ボタン＋クラスタ説明 Box ==================== */
function ClusterHeaderBox({
  swing,
  loading,
  onStart,
}: {
  swing: RandomSwingApi;
  loading: boolean;
  onStart: () => void;
}) {
  const cluster =
    clusters.find((c) => c.cluster_id === swing.swing_cluster_unified) ?? null;
  const clubLabel = swing.clubType === "D" ? "ドライバー" : "アイアン";

  return (
    <div className="flex w-full rounded-lg bg-[#101624] p-2 gap-5 items-center">
      <button
        onClick={onStart}
        disabled={loading}
        className="shrink-0 flex flex-col items-center gap-1"
      >
        <div
          className={`relative w-18 h-18 rounded-full border-2 flex items-center justify-center ${
            loading
              ? "border-gray-500 opacity-50 cursor-not-allowed"
              : "border-blue-400 hover:border-blue-300"
          }`}
        >
          {!loading && (
            <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-60 animate-[ping_3s_linear_infinite]" />
          )}
          <Image src={tracerLogo} alt="M-Tracer" width={60} height={60} />
        </div>
        <span className="text-sm font-normal leading-tight text-white text-center">
          START&nbsp;YOUR&nbsp;SWING
        </span>
      </button>

      <div className="flex-1 leading-tight">
        <p className="text-sm text-white font-semibold">
          スイング判定 / 使用クラブ：{clubLabel}
        </p>
        <h3 className="text-2xl font-semibold text-white">
          {cluster ? cluster.cluster_name : "クラスタ不明"}
        </h3>
        <p className="text-sm text-gray-300">{cluster ? cluster.overview : "–"}</p>
      </div>
    </div>
  );
}

/* ============================= ページ ============================== */
export default function SimulatePage() {
  const [swing, setSwing] = useState<RandomSwingApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAdvice, setGeneratedAdvice] = useState<string | null>(null);

  const fetchRandomSwing = async () => {
    setLoading(true);
    setSwing(null);
    setGeneratedAdvice(null);
    try {
      const res = await fetch(`/api/random-swing?ts=${Date.now()}`, {
        cache: "no-store",
      });
      setSwing((await res.json()) as RandomSwingApi);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomSwing();
  }, []);

  const headSpeed =
    swing?.impactHeadSpeed ?? (swing ? swing.estimateCarry / 4.47 : null);

  return (
    <div className="flex flex-col h-screen bg-[#080d16] text-gray-100">
      <Header />

      <main className="flex-1 h-0 px-4 pb-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* 左ペイン：3Dビュー */}
          <section className="lg:col-span-5 h-full">
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">
              <Canvas camera={{ fov: 40, near: 0.1, far: 1500 }} shadows>
                <CameraSetup />
                <ambientLight intensity={0.6} />
                <directionalLight position={[50, 80, -30]} intensity={1} castShadow />

                <group position={[0, -15, 0]} rotation={[+Math.PI / 36, 0, 0]}>
                  <Background width={240} height={120} z={270} />
                  <FairwayGround width={200} depth={300} offsetZ={30} y={-0.5} />
                  <FairwayGuide width={200} depth={300} interval={25} y={0.01} />

                  {swing && (
                    <TrajectoryWithBall
                      key={`${swing.estimateCarry}-${swing.impactFaceAngle}`}
                      estimateCarry={swing.estimateCarry}
                      impactAttackAngle={swing.impactAttackAngle}
                      impactFaceAngle={swing.impactFaceAngle}
                      impactClubPath={swing.impactClubPath}
                      clubType={swing.clubType}
                      impactLoftAngle={swing.impactLoftAngle}
                    />
                  )}
                </group>
                <OrbitControls enableDamping dampingFactor={0.1} />
              </Canvas>
            </div>
          </section>

          {/* 右ペイン：情報パネル */}
          <section className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto pb-2">
            {swing && (
              <>
                <ClusterHeaderBox
                  swing={swing}
                  loading={loading}
                  onStart={fetchRandomSwing}
                />

                <MeasureStartBox swing={swing} headSpeed={headSpeed} />

                {/* ★ ここで impactPointX / Y を渡す！ */}
                <SummaryPanels
  clubType={swing.clubType}
  faceAngle={swing.impactFaceAngle}
  attackAngle={swing.impactAttackAngle}
  loftAngle={swing.impactLoftAngle}
  pointX={swing.impactPointX}
  pointY={swing.impactPointY}
  advice={generatedAdvice}
/>

              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );


}
// -----------------------------------------------------------------------------
