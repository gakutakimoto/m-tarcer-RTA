// -----------------------------------------------------------------------------
// src/app/rta/page.tsx
//   3D 軌道ビュー + 右パネル
//   ・VoiceAdvisorBar に JP / EN 言語トグル対応
//   ・TTS “simple” 発話（言語指定付き）
// -----------------------------------------------------------------------------
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

/* ---------- UI components ---------- */
import Header                 from "@/components/Header";
import MeasureStartBox        from "@/components/MeasureStartBox";
import SummaryPanels          from "@/components/SummaryPanels";
import Background             from "@/components/Background";
import FairwayGround          from "@/components/FairwayGround";
import FairwayGuide           from "@/components/FairwayGuide";
import TrajectoryWithBall     from "@/components/TrajectoryWithBall";
import ClusterSummary         from "@/components/ClusterSummary";
import SuccessBars            from "@/components/SuccessBars";
import OverlayHUD             from "@/components/OverlayHUD";
import SixAxisRadarWithTable  from "@/components/SixAxisRadarWithTable";
import VoiceAdvisorBar        from "@/components/VoiceAdvisorBar";

/* ---------- utils ---------- */
import { classifySwing }      from "@/utils/classifySwing";
import { speak }              from "@/utils/speak";

/* ---------- data ---------- */
import clusters               from "@/data/clusters.json";
import keysJson               from "@/data/featureImportance.json";

/* ---------- three.js ---------- */
import { Canvas, useThree }   from "@react-three/fiber";
import { OrbitControls }      from "@react-three/drei";

/* ======================= 3D Camera ======================= */
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, -50);
    camera.lookAt(0, 1, 120);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/* ======================= 型定義 ======================= */
interface RTASwing {
  clubType: "D" | "I";
  estimateCarry: number;
  impactHeadSpeed?: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number | null;
  impactPointY: number | null;
  halfwaybackFaceAngleToVertical: number | null;
  topFaceAngleToHorizontal: number | null;
  halfwaydownFaceAngleToVertical: number | null;
  downSwingShaftRotationMax: number;
  downSwingShaftRotationMin: number;
  impactHandFirst: number;
  impactLieAngle: number;
  addressLieAngle: number;
  impactGripSpeed: number;
}

/* ======================= helper ======================= */
const safe = (v: number | undefined | null) =>
  isFinite(v as number) ? Math.round((v as number) * 10) : 0;
const swingHash = (s: RTASwing) =>
  [safe(s.estimateCarry), safe(s.impactFaceAngle), safe(s.impactClubPath)].join("|");

type VoiceModeState = "simple" | "zeroFace" | "success" | null;
type Lang = "jp" | "en";

/* ===================================================================== */
export default function RTAPage() {
  /* ---- UI / RT state ---------------- */
  const [uid, setUid]           = useState("");
  const [realtime, setRealtime] = useState(false);
  const realtimeFlagRef         = useRef(false);
  const timerRef                = useRef<NodeJS.Timeout | null>(null);
  const abortRef                = useRef<AbortController | null>(null);
  const lastHash                = useRef<string>("");

  const [swing,  setSwing]      = useState<RTASwing | null>(null);
  const [head,   setHead]       = useState<number | null>(null);

  /* ---- クラスタ & 成功キー --------- */
  const [cluster, setCluster]   = useState<number | null>(null);
  const [keys,    setKeys]      = useState<any[]>([]);

  /* ---- Voice Advisor ---------------- */
  const [voiceMode, setVoiceMode] = useState<VoiceModeState>(null);
  const [lang, setLang]           = useState<Lang>("jp");

  /* ---- fetch RT -------------------- */
  const fetchRT = async () => {
    if (!uid) return;
    abortRef.current = new AbortController();
    try {
      const res = await fetch(
        `/api/rta-swing?uid=${encodeURIComponent(uid)}&days=30`,
        { cache: "no-store", signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error("fetch failed");

      const d: RTASwing = await res.json();
      if (!realtimeFlagRef.current) return;

      const h = swingHash(d);
      if (h === lastHash.current) return;
      lastHash.current = h;

      setSwing(d);
      setHead(d.impactHeadSpeed ?? d.estimateCarry / 4.47);

      const cl = classifySwing(d);
      setCluster(cl);
      setKeys(keysJson[cl]?.slice(0, 5) ?? []);
    } catch (e: any) {
      if (e.name !== "AbortError") console.error(e);
    }
  };

  /* ---- realtime toggle ------------ */
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
      abortRef.current?.abort();
      setSwing(null);
      setCluster(null);
      setKeys([]);
    }
  };

  /* ---- cleanup -------------------- */
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  /* ---- 6-Axis radar input --------- */
  const radarData = useMemo(() => {
    if (!swing) return null;
    return {
      halfwaybackFaceAngleToVertical: swing.halfwaybackFaceAngleToVertical ?? 0,
      halfwaydownFaceAngleToVertical: swing.halfwaydownFaceAngleToVertical ?? 0,
      impactHandFirst:                swing.impactHandFirst,
      LieDelta:                       swing.impactLieAngle - swing.addressLieAngle,
      SRDelta:                        swing.downSwingShaftRotationMax - swing.downSwingShaftRotationMin,
      ClosureAngle:                   (swing.topFaceAngleToHorizontal ?? 0) -
                                      (swing.halfwaydownFaceAngleToVertical ?? 0),
    };
  }, [swing]);

  /* ---- クラスタ情報 --------------- */
  const clusterInfo = useMemo(() => {
    if (cluster === null) return null;
    return (clusters as any[]).find((c) => c.cluster_id === cluster) ?? null;
  }, [cluster]);

/* ---- TTS 発話（simple / zeroFace / success）------------- */
useEffect(() => {
  if (!swing) return;          // スイングが無ければ終了

  switch (voiceMode) {
    /* ① 結果報告 */
    case "simple":
      speak("simple", {
        swingResult: swing,
        lang,
      }).catch(console.error);
      break;

    /* ② FaceAngle Guide */
    case "zeroFace":
      speak("zero-face", {
        swingResult: swing,
        lang,
      }).catch(console.error);
      break;

    /* ③ Total AI Advice */
    case "success":
      speak("success", {
        swingResult: swing,
        clusterId:   cluster,   // ← 成功モデル参照に必要
        lang,
      }).catch(console.error);
      break;

    default:
      break;
  }
}, [swing, voiceMode, lang, cluster]);



  /* ----------------------------- JSX ----------------------------- */
  return (
    <div className="flex flex-col h-screen bg-[#080d16] text-gray-100">
      <Header />

      <main className="flex-1 h-0 px-4 pb-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full">
          {/* ---------- 3D VIEW ---------- */}
          <section className="lg:col-span-5 h-full">
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">
              {/* UID 入力バー */}
              <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2
                           w-[430px] max-w-[90vw] pl-3 pr-1 py-2 rounded-md"
              >
                <input
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="input Your M-Tracer ID"
                  className="flex-1 h-6 px-3 rounded-md bg-[#0e1524]/40
                             text-sm placeholder:text-gray-300"
                />
                <button
                  onClick={toggleRealtime}
                  disabled={!uid}
                  className={`h-6 px-4 rounded-md text-sm font-semibold shadow-md transition
                    ${!uid
                      ? "bg-gray-400 cursor-not-allowed"
                      : realtime
                        ? "bg-rose-500 hover:bg-rose-600"
                        : "bg-green-600 hover:bg-green-500"}`}
                >
                  {realtime ? "リアルタイム計測停止" : "リアルタイム計測開始"}
                </button>
              </div>

              {/* 半透明メトリクスパネル */}
              {swing && <MeasureStartBox swing={swing} headSpeed={head} />}

              {/* three.js */}
              <Canvas camera={{ fov: 40, near: 0.1, far: 1500 }} shadows>
                <CameraSetup />
                <ambientLight intensity={0.6} />
                <directionalLight position={[50, 80, -30]} intensity={1} castShadow />
                <group position={[0, -15, 0]} rotation={[Math.PI / 36, 0, 0]}>
                  <Background    width={240} height={120} z={270} />
                  <FairwayGround width={200} depth={300} offsetZ={30} y={-0.5} />
                  <FairwayGuide  width={200} depth={300} interval={25} y={0.01} />
                  {swing && (
                    <TrajectoryWithBall
                      key={swingHash(swing)}
                      estimateCarry     ={swing.estimateCarry}
                      impactAttackAngle ={swing.impactAttackAngle}
                      impactFaceAngle   ={swing.impactFaceAngle}
                      impactClubPath    ={swing.impactClubPath}
                      clubType          ={swing.clubType}
                      impactLoftAngle   ={swing.impactLoftAngle}
                    />
                  )}
                </group>
                <OrbitControls enableDamping dampingFactor={0.1} />
              </Canvas>

              {/* -------- Overlay HUD -------- */}
              <OverlayHUD
                clusterName={clusterInfo ? clusterInfo.cluster_name : "クラスタ解析中…"}
                clusterDesc={clusterInfo ? clusterInfo.overview     : "スイングデータを取得するとここに表示されます"}
              />
            </div>
          </section>

          {/* ---------- RIGHT PANE ---------- */}
          <section className="lg:col-span-7 flex flex-col bg-[#0e1524] rounded-lg">
            {/* ==== Voice Advisor Toggle Bar ==== */}
            <VoiceAdvisorBar
              mode={voiceMode}
              onChange={setVoiceMode}
              lang={lang}
              onLangChange={setLang}
              disabled={!swing}
            />

            {/* ==== Scrollable contents ==== */}
            <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-2">
              {swing && radarData ? (
                <>
                  {/* ------------- 計測サマリ ------------- */}
                  <SummaryPanels
                    clubType  ={swing.clubType}
                    faceAngle ={swing.impactFaceAngle}
                    loftAngle ={swing.impactLoftAngle}
                    pointX    ={swing.impactPointX}
                    pointY    ={swing.impactPointY}
                  />

                  {/* ------------- レーダー + テーブル ------------- */}
                  <SixAxisRadarWithTable swing={radarData as any} clubType={swing.clubType} />

                  {/* ------------- クラスタ概要 + 成功バー ------------- */}
                  {cluster !== null && keys.length > 0 && (
                    <>
                      <ClusterSummary clusterId={cluster} hide />
                      <SuccessBars swing={swing} keys={keys} />
                    </>
                  )}
                </>
              ) : (
                <div className="flex-1 rounded-lg bg-[#101624] flex items-center justify-center text-sm">
                  上のフォームに M-Tracer ID を入力して「開始」を押してください
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
// -----------------------------------------------------------------------------
