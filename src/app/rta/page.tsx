// -----------------------------------------------------------------------------
// src/app/rta/page.tsx
//  ── Real‑Time Advisor モード（UID 入力 → 単発 or 1 秒ごと自動更新）
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

/* ▽ 3D カメラ設定（simulate と同じ） */
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, -50);
    camera.lookAt(0, 1, 120);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
/* △ ---------------------------------------------------------- */

/* ===== API から返ってくる型 ===== */
interface RTASwing {
  swingId?: string;                // ← API で返るなら差分判定に利用
  swing_cluster_unified: number | null;
  clubType: "D" | "I";
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;      // ※ Vercel 側キー名（= down/up ではなくロフト角）
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number;
  impactPointY: number;
}
/* ------------------------------------------------------------ */

export default function RTAPage() {
  /* ---------- フォーム / 状態 ---------- */
  const [uid, setUid]           = useState<string>("");   // ← デフォルト空欄
  const [days]                  = useState("45");         // 必要なら入力 UI を追加しても OK
  const [loading, setLoading]   = useState(false);
  const [isRealtime, setRealtime] = useState(false);      // ⇦ RT 監視フラグ
  const timerRef                = useRef<NodeJS.Timeout | null>(null);

  /* ---------- 取得データ ---------- */
  const [swing, setSwing]       = useState<RTASwing | null>(null);
  const [headSpeed, setHS]      = useState<number | null>(null);

  /* ---------- API 呼び出し ---------- */
  const fetchRTASwing = async () => {
    if (!uid) return;

    try {
      const res = await fetch(
        `/api/rta-swing?uid=${encodeURIComponent(uid)}&days=${days}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;

      const data = (await res.json()) as RTASwing;

      /* ====== 同一スイング判定 ===== */
      const sameSwing =
        swing &&
        (
          (data.swingId && data.swingId === swing.swingId) || // ID が取れるならここで判定
          (!data.swingId &&                                      // ID が無い場合は数値で判定
            data.estimateCarry     === swing.estimateCarry &&
            data.impactFaceAngle   === swing.impactFaceAngle &&
            data.impactAttackAngle === swing.impactAttackAngle &&
            data.impactPointX      === swing.impactPointX &&
            data.impactPointY      === swing.impactPointY)
        );

      if (sameSwing) return;     // まったく同じ → 何も更新しない
      /* ============================ */

      setSwing(data);
      setHS(
        data.impactHeadSpeed ?? data.estimateCarry / 4.47  // fallback
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------- ボタン操作 ---------- */
  const handleSingleFetch = async () => {
    setLoading(true);
    await fetchRTASwing();
    setLoading(false);
  };

  const toggleRealtime = () => setRealtime((prev) => !prev);

  /* ---------- ポーリング制御 ---------- */
  useEffect(() => {
    if (isRealtime) {
      fetchRTASwing();                             // 即 1 発目
      timerRef.current = setInterval(fetchRTASwing, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealtime, uid]);

  /* ============== UI ============== */
  return (
    <div className="flex flex-col h-screen bg-[#080d16] text-gray-100">
      <Header />

      {/* ------ UID 入力 & ボタン群 ------ */}
      <div className="px-4 py-2 bg-[#0e1524] flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium whitespace-nowrap">M‑Tracer&nbsp;ID:</label>

        <input
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="★ここにエムトレ ID を入力。アプリ左上メニュー → ユーザーネーム下の文字列をコピー★"
          className="px-2 py-1 flex-1 min-w-0 rounded bg-[#1a2336] text-sm placeholder-gray-400"
        />

        <button
          onClick={handleSingleFetch}
          disabled={loading || !uid || isRealtime}
          className={`px-4 py-1 rounded text-sm font-semibold ${
            loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          スイング計測開始
        </button>

        <button
          onClick={toggleRealtime}
          disabled={!uid}
          className={`px-4 py-1 rounded text-sm font-semibold ${
            isRealtime ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {isRealtime ? "リアルタイム停止" : "リアルタイム計測"}
        </button>
      </div>

      {/* ------ 2 カラムメイン ------ */}
      <main className="flex-1 h-0 px-4 pb-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* === 左 : 3D 弾道 === */}
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
                      key={`${swing.estimateCarry}-${swing.impactFaceAngle}-${swing.impactAttackAngle}`}
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

          {/* === 右 : 指標 & 図解 === */}
          <section className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto">
            {swing ? (
              <>
                <MeasureStartBox swing={swing} headSpeed={headSpeed} />
                <SummaryPanels
                  clubType={swing.clubType}
                  faceAngle={swing.impactFaceAngle}
                  attackAngle={swing.impactLoftAngle}
                  pointX={swing.impactPointX}
                  pointY={swing.impactPointY}
                  advice={null}
                />
              </>
            ) : (
              <div className="flex-1 rounded-lg bg-[#101624] flex items-center justify-center text-gray-500 text-sm">
                エムトレ ID を入力して「スイング計測開始」または「リアルタイム計測」を押してください
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
