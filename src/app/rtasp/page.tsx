// -----------------------------------------------------------------------------
// src/app/rtasp/page.tsx  –  Mobile-first RTA
//  • SP: 3Dビュー (60 vh) + 下部カード縦スクロール
//  • PC: 従来どおり 3D + 右ペイン 2 カラム
//  • SP では Canvas の pointer-events を切り、スクロール阻害を防止
// -----------------------------------------------------------------------------
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

/* ---------- components ---------- */
import Header                 from "@/components/Header";
import MeasureStartBoxSp      from "@/components/MeasureStartBoxSp";
import SummaryPanelsSp        from "@/components/SummaryPanelsSp";
import SixAxisRadarSp         from "@/components/SixAxisRadarSp";
import Background             from "@/components/Background";
import FairwayGround          from "@/components/FairwayGround";
import FairwayGuide           from "@/components/FairwayGuide";
import TrajectoryWithBall     from "@/components/TrajectoryWithBall";
import ClusterSummary         from "@/components/ClusterSummary";
import SuccessBars            from "@/components/SuccessBars";
import OverlayHUD             from "@/components/OverlayHUD";
import VoiceAdvisorBar        from "@/components/VoiceAdvisorBar";

/* ---------- utils & data ---------- */
import { classifySwing }      from "@/utils/classifySwing";
import { speak }              from "@/utils/speak";
import clusters               from "@/data/clusters.json";
import keysJson               from "@/data/featureImportance.json";

/* ---------- three.js ---------- */
import { Canvas, useThree }   from "@react-three/fiber";
import { OrbitControls }      from "@react-three/drei";

/* ================= 3D Camera ================= */
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, -50);
    camera.lookAt(0, 1, 120);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/* ================= 型 & helper ================= */
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

const safe      = (v:number|undefined|null)=>isFinite(v as number)?Math.round((v as number)*10):0;
const swingHash = (s:RTASwing)=>[safe(s.estimateCarry),safe(s.impactFaceAngle),safe(s.impactClubPath)].join("|");

type VoiceModeState = "simple" | "zeroFace" | "success" | null;
type Lang           = "jp" | "en";

/* ===================================================================== */
export default function RTASpPage() {
  /* -------- State -------- */
  const [uid, setUid]             = useState("");
  const [realtime, setRealtime]   = useState(false);
  const realtimeRef               = useRef(false);
  const timerRef                  = useRef<NodeJS.Timeout|null>(null);
  const abortRef                  = useRef<AbortController|null>(null);
  const lastHashRef               = useRef("");

  const [swing,  setSwing]        = useState<RTASwing|null>(null);
  const [head,   setHead]         = useState<number|null>(null);

  const [cluster, setCluster]     = useState<number|null>(null);
  const [keys,    setKeys]        = useState<any[]>([]);

  const [voiceMode, setVoiceMode] = useState<VoiceModeState>(null);
  const [lang,      setLang]      = useState<Lang>("jp");

  /* -------- fetch RT -------- */
  const fetchRT = async () => {
    if (!uid) return;
    abortRef.current = new AbortController();
    try {
      const res = await fetch(
        `/api/rta-swing?uid=${encodeURIComponent(uid)}&days=30`,
        { cache:"no-store", signal:abortRef.current.signal }
      );
      if (!res.ok) throw new Error("fetch failed");
      const d:RTASwing = await res.json();
      if (!realtimeRef.current) return;

      const h = swingHash(d);
      if (h === lastHashRef.current) return;
      lastHashRef.current = h;

      setSwing(d);
      setHead(d.impactHeadSpeed ?? d.estimateCarry / 4.47);

      const cl = classifySwing(d);
      setCluster(cl);
      setKeys(keysJson[cl]?.slice(0,5) ?? []);
    } catch(e:any){
      if (e.name!=="AbortError") console.error(e);
    }
  };

  /* -------- toggle RT -------- */
  const toggleRealtime = () => {
    const next = !realtimeRef.current;
    realtimeRef.current = next;
    setRealtime(next);

    if (next){
      lastHashRef.current = "";
      fetchRT();
      timerRef.current = setInterval(fetchRT,1000);
    }else{
      timerRef.current && clearInterval(timerRef.current);
      abortRef.current?.abort();
      setSwing(null); setCluster(null); setKeys([]);
    }
  };

  /* cleanup */
  useEffect(()=>() =>{
    timerRef.current && clearInterval(timerRef.current);
    abortRef.current?.abort();
  },[]);

  /* 6-Axis input */
  const radarData = useMemo(()=>{
    if (!swing) return null;
    return {
      halfwaybackFaceAngleToVertical : swing.halfwaybackFaceAngleToVertical ?? 0,
      halfwaydownFaceAngleToVertical : swing.halfwaydownFaceAngleToVertical ?? 0,
      impactHandFirst                : swing.impactHandFirst,
      LieDelta                       : swing.impactLieAngle - swing.addressLieAngle,
      SRDelta                        : swing.downSwingShaftRotationMax - swing.downSwingShaftRotationMin,
      ClosureAngle                   : (swing.topFaceAngleToHorizontal ?? 0) -
                                       (swing.halfwaydownFaceAngleToVertical ?? 0),
    };
  },[swing]);

  /* cluster info */
  const clusterInfo = useMemo(()=>{
    if (cluster===null) return null;
    return (clusters as any[]).find(c=>c.cluster_id===cluster) ?? null;
  },[cluster]);

  /* ------- TTS ------- */
  const lastSpeechRef = useRef("");
  useEffect(()=>{
    if (!swing || !voiceMode) return;
    const hash = `${voiceMode}:${swingHash(swing)}`;
    if (hash === lastSpeechRef.current) return;
    lastSpeechRef.current = hash;
    const opt = { swingResult:swing, lang };
    if (voiceMode==="simple")   speak("simple",   opt).catch(console.error);
    if (voiceMode==="zeroFace") speak("zero-face",opt).catch(console.error);
    if (voiceMode==="success")  speak("success",  opt).catch(console.error);
  },[swing,voiceMode,lang]);

  /* ---------------- JSX ---------------- */
  return (
    <div className="flex flex-col min-h-screen bg-[#080d16] text-gray-100">
      <Header/>

      <main className="flex-1 h-0 px-2 pb-4 overflow-auto lg:overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2">

          {/* ===== 3D VIEW ===== */}
          <section className="lg:col-span-5">
            <div className="relative w-full h-[60vh] lg:h-full overflow-hidden rounded-lg bg-black">

              {/* --- UID 入力バー --- */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20
                              flex gap-2 w-[450px] max-w-[90vw] pl-3 pr-1 py-0 rounded-md">
                <input
                  value={uid}
                  onChange={e=>setUid(e.target.value)}
                  placeholder="input Your M-Tracer ID"
                  className="flex-1 h-7 px-3 rounded-md bg-[#0e1524]/40
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

              {/* --- 数値カード (SP) --- */}
              {swing && <MeasureStartBoxSp swing={swing} headSpeed={head}/>}

              {/* --- three.js Canvas --- */}
              <Canvas
                camera={{ fov:40, near:0.1, far:1500 }}
                shadows
                className="pointer-events-none lg:pointer-events-auto"
              >
                <CameraSetup/>
                <ambientLight intensity={0.6}/>
                <directionalLight position={[50,80,-30]} intensity={1} castShadow/>
                <group position={[0,-15,0]} rotation={[Math.PI/36,0,0]}>
                  <Background width={240} height={120} z={270}/>
                  <FairwayGround width={200} depth={300} offsetZ={30} y={-0.5}/>
                  <FairwayGuide  width={200} depth={300} interval={25} y={0.01}/>
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
                <OrbitControls enableDamping dampingFactor={0.1}/>
              </Canvas>

            </div>
          </section>

          {/* ===== 右パネル (モバイルでは 3D の下) ===== */}
          <section className="lg:col-span-7 flex flex-col bg-[#0e1524] rounded-lg">
            <VoiceAdvisorBar
              mode={voiceMode} onChange={setVoiceMode}
              lang={lang}      onLangChange={setLang}
              disabled={!swing}
            />

            <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-2">
              {swing && radarData ? (
                <>
                  <SummaryPanelsSp
                    clubType ={swing.clubType}
                    faceAngle={swing.impactFaceAngle}
                    loftAngle={swing.impactLoftAngle}
                    pointX   ={swing.impactPointX}
                    pointY   ={swing.impactPointY}
                  />

                  <SixAxisRadarSp swing={radarData as any} clubType={swing.clubType} />

                  {cluster!==null && keys.length>0 && (
                    <>
                      <ClusterSummary clusterId={cluster} hide/>
                      <SuccessBars swing={swing} keys={keys}/>
                    </>
                  )}
                </>
              ):(
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
