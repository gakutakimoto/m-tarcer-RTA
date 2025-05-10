// -----------------------------------------------------------------------------
// src/app/rta/page.tsx   (RTA ライブページ)
// -----------------------------------------------------------------------------
"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import MeasureStartBox from "@/components/MeasureStartBox";
import SummaryPanels from "@/components/SummaryPanels";
import Background from "@/components/Background";
import FairwayGround from "@/components/FairwayGround";
import FairwayGuide from "@/components/FairwayGuide";
import TrajectoryWithBall from "@/components/TrajectoryWithBall";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/* -------------------- 3D camera -------------------- */
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, -50);
    camera.lookAt(0, 1, 120);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/* -------------------- types -------------------- */
interface RTASwing {
  clubType: "D" | "I";
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number;
  impactPointY: number;
}

/* ===================================================================== */
export default function RTAPage() {
  /* --- state / ref --- */
  const [uid, setUid]                  = useState("");
  const [loading, setLoading]          = useState(false);
  const [realtime, setRealtime]        = useState(false);      // UI 用
  const realtimeFlagRef               = useRef(false);        // 即時フラグ

  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const lastHash  = useRef<string>("");

  const [swing,   setSwing]   = useState<RTASwing | null>(null);
  const [head,    setHead]    = useState<number | null>(null);
  const [advice,  setAdvice]  = useState<string | null>(null);

  /* --- util --- */
  const safe = (v: number | undefined | null) =>
    isFinite(v as number) ? Math.round((v as number) * 10) : Math.random();
  const hash = (s: RTASwing) =>
    [
      safe(s.estimateCarry),
      safe(s.impactFaceAngle),
      safe(s.impactAttackAngle),
      safe(s.impactClubPath),
      safe(s.impactLoftAngle),
      s.clubType,
    ].join("|");

  /* --- simple advice --- */
  const fetchAdvice = async (d: RTASwing) => {
    try {
      const res = await fetch("/api/generate-advice/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swingResult: d, tone: "gal" }),
      });
      if (!res.ok) throw new Error();
      const { advice } = await res.json();
      setAdvice(advice);
    } catch {
      setAdvice("(取得失敗)");
    }
  };

  /* --- fetch RT --- */
  const fetchRT = async () => {
    if (!uid) return;
    abortRef.current = new AbortController();
    try {
      const res = await fetch(
        `/api/rta-swing?uid=${encodeURIComponent(uid)}`,
        { cache: "no-store", signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error();
      const d: RTASwing = await res.json();

      if (!realtimeFlagRef.current) return;           // 停止後は無視

      const h = hash(d);
      if (h === lastHash.current) return;
      lastHash.current = h;

      setSwing(d);
      setHead(d.impactHeadSpeed ?? d.estimateCarry / 4.47);
      fetchAdvice(d);
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    }
  };

  /* --- single shot --- */
  const handleSingle = async () => {
    lastHash.current = "";
    setLoading(true);
    await fetchRT();
    setLoading(false);
  };

  /* --- toggle realtime --- */
  const toggleRealtime = () => {
    const next = !realtimeFlagRef.current;
    realtimeFlagRef.current = next;
    setRealtime(next);

    if (next) {
      lastHash.current = "";
      fetchRT();
      timerRef.current = setInterval(fetchRT, 1000);
    } else {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = null;
      abortRef.current?.abort();
      setSwing(null);
    }
  };

  /* --- cleanup on unmount --- */
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  /* ----------------------------- JSX ----------------------------- */
  return (
    <div className="flex flex-col h-screen bg-[#080d16] text-gray-100">
      <Header />

      {/* main */}
      <main className="flex-1 h-0 px-4 pb-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* left: 3D */}
          <section className="lg:col-span-5 h-full">
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">
              <Canvas camera={{ fov: 40, near: 0.1, far: 1500 }} shadows>
                <CameraSetup />
                <ambientLight intensity={0.6} />
                <directionalLight position={[50, 80, -30]} intensity={1} castShadow />

                <group position={[0, -15, 0]} rotation={[Math.PI / 36, 0, 0]}>
                  <Background width={240} height={120} z={270} />
                  <FairwayGround width={200} depth={300} offsetZ={30} y={-0.5} />
                  <FairwayGuide width={200} depth={300} interval={25} y={0.01} />

                  {swing && (
                    <TrajectoryWithBall
                      key={hash(swing)}
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

          {/* right: panels */}
          <section className="lg:col-span-7 flex flex-col gap-2 overflow-y-auto">
            {/* ===== 追加：ID + ボタン 2 段レイアウト ===== */}
{/* ===== ID + ボタン：横 1 行レイアウト ===== */}
<div className="bg-[#0e1524] rounded-lg p-3 flex items-center gap-2">
  {/* ラベル */}
  <label className="text-lg font-nomal whitespace-nowrap shrink-0">
    M-Tracer ID:
  </label>

  {/* 入力ボックス */}
  <input
    value={uid}
    onChange={(e) => setUid(e.target.value)}
    placeholder="M-Tracerアプリプロフィールに表示されるIDを入力"
    className="flex-1 min-w-0 px-3 py-1 rounded bg-[#1a2336] border border-zinc-700 text-sm placeholder-gray-400"
  />

  {/* ボタン */}
  <button
    onClick={toggleRealtime}
    disabled={!uid}
    className={`shrink-0 px-4 py-2 rounded-3xl text-white font-semibold shadow-md transition
      ${
        !uid
          ? "bg-gray-500 cursor-not-allowed"
          : realtime
          ? "bg-gradient-to-r from-red-900 to-red-500 hover:from-red-700 hover:to-red-400"
          : "bg-gradient-to-r from-green-900 to-green-500 hover:from-green-700 hover:to-green-400"
      }`}
  >
    {realtime ? "リアルタイム計測終了" : "リアルタイム計測開始"}
  </button>
</div>

            {/* ===== コンテンツ領域 ===== */}
            {swing ? (
              <>
                <MeasureStartBox swing={swing} headSpeed={head} />
                <SummaryPanels
                  clubType={swing.clubType}
                  faceAngle={swing.impactFaceAngle}
                  attackAngle={swing.impactAttackAngle}
                  pointX={swing.impactPointX}
                  pointY={swing.impactPointY}
                  advice={advice}
                />
              </>
            ) : (
              <div className="flex-1 rounded-lg bg-[#101624] flex items-center justify-center text-gray-500 text-sm">
                M-Tracer ID を入力し「リアルタイム開始」を押してください
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
// -----------------------------------------------------------------------------
