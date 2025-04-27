// src/app/practice/page.tsx (エラー修正・音声改善 全文)
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Header from "@/components/Header";
import MetricCard from '@/components/MetricCard';
import SuccessFactorsTable from "@/components/SuccessFactorsTable";
import clusterSuccessMedians from "@/data/cluster_success_medians.json";
import featureImportanceData from "@/data/featureImportance.json";
import clustersData from "@/data/clusters.json";



// 簡単アドバイスを生成する関数
const fetchSimpleAdvice = async (swingResult: SwingDataFromApi) => {
  try {
    const res = await fetch('/api/generate-simple-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swingResult }),
    });

    if (!res.ok) {
      throw new Error('簡単アドバイス生成に失敗');
    }

    const data = await res.json();
    return data.advice || '(アドバイス未生成)';
  } catch (error) {
    console.error('fetchSimpleAdvice error:', error);
    return '(アドバイス未生成)';
  }
};



      


// --- 型定義 ---
interface SwingDataFromApi { id: number; swing_cluster_unified: number; estimateCarry: number; impactHeadSpeed: number; impactGripSpeed: number; impactClubPath: number; impactFaceAngle: number; impactAttackAngle: number; faceToPath: number; swing_success: boolean | null; club_type: 'D' | 'I'; fetchedAt: string; addressHandFirst?: number | null; addressLieAngle?: number | null; halfwaydownFaceAngleToVertical?: number | null; downSwingShaftRotationMax?: number | null; halfwaybackFaceAngleToVertical?: number | null; topFaceAngleToHorizontal?: number | null; downSwingShaftRotationMin?: number | null; advice?: string; isGeneratingAdvice?: boolean; }
interface ClusterInfo { cluster_id: number; cluster_name: string; overview: string; }
interface ClusterMedianData { cluster_id: number; estimateCarry?: number; impactHeadSpeed?: number; impactFaceAngle?: number; impactClubPath?: number; impactAttackAngle?: number; impactGripSpeed?: number; faceToPath?: number; impactRelativeFaceAngle?: number; }
const clusterMediansTyped: ClusterMedianData[] = clusterSuccessMedians as ClusterMedianData[];
type ImportanceData = { [key: string]: { feature: string; importance: number; median: number }[]; };
const importanceDataTyped = featureImportanceData as ImportanceData;

// --- 定数マップ ---
const featureNameMap: { [key: string]: string } = { addressHandFirst: "アドレス ハンドファースト", addressLieAngle: "アドレス ライ角", halfwaydownFaceAngleToVertical: "ハーフウェイダウン フェース角", impactGripSpeed: "インパクト グリップスピード", downSwingShaftRotationMax: "ダウンスイング シャフト最大回転", halfwaybackFaceAngleToVertical: "HB フェース角(垂直)", topFaceAngleToHorizontal: "トップアングル フェース角", downSwingShaftRotationMin: "ダウンスイング シャフト最小回転", };
const featureUnitMap: { [key: string]: string } = { addressHandFirst: "", addressLieAngle: "°", halfwaydownFaceAngleToVertical: "°", impactGripSpeed: "m/s", downSwingShaftRotationMax: "dps", halfwaybackFaceAngleToVertical: "°", topFaceAngleToHorizontal: "°", downSwingShaftRotationMin: "dps", estimateCarry: "yd", impactHeadSpeed: "m/s", impactClubPath: "°", impactFaceAngle: "°", faceToPath: "°", impactAttackAngle: "°", impactRelativeFaceAngle: "°" };
const featureProcessMap: { [key: string]: string } = { addressHandFirst: "アドレス", addressLieAngle: "アドレス", halfwaybackFaceAngleToVertical: "バックスイング", topFaceAngleToHorizontal: "バックスイング", halfwaydownFaceAngleToVertical: "ダウンスイング", downSwingShaftRotationMax: "ダウンスイング", downSwingShaftRotationMin: "ダウンスイング", impactGripSpeed: "インパクト直前", };
const historyHeaderMap: { [key: string]: string } = { fetchedAt: "日時", swingType: "ｽｲﾝｸﾞﾀｲﾌﾟ名", estimateCarry: "CARRY", impactHeadSpeed: "HEAD SPEED", impactFaceAngle: "FACE Angle", impactClubPath: "CLUB PATH", impactAttackAngle: "ATC ANGLE", evaluation: "評価", advice: "簡単ｱﾄﾞﾊﾞｲｽ" };

// --- ヘルパー関数 ---
const getComparisonBgColor = (actual: number | null, target: number): string => { if (actual === null) return 'bg-gray-700 bg-opacity-30'; const diff = actual - target; const threshold = 0.1; if (diff > threshold) return 'bg-green-800 bg-opacity-40'; if (diff < -threshold) return 'bg-red-800 bg-opacity-40'; return 'bg-transparent'; };
const getHistoryCellBgColor = (targetValue: number | undefined, actualValue: number | undefined | null): string => { if (targetValue === undefined || actualValue === undefined || actualValue === null) return 'bg-transparent'; if (targetValue === 0) { if (actualValue === 0) return 'bg-transparent'; return 'bg-gray-700 bg-opacity-30'; } const diffPercent = Math.abs(((actualValue - targetValue) / targetValue) * 100); if (diffPercent >= 50) return 'bg-red-800 bg-opacity-40'; if (diffPercent <= 10) return 'bg-blue-800 bg-opacity-40'; return 'bg-transparent'; };
const formatDateTime = (isoString: string | null | undefined): string => { if (!isoString) return '---'; try { const date = new Date(isoString); if (isNaN(date.getTime())) { return 'Invalid Date'; } const month = (date.getMonth() + 1).toString().padStart(2, '0'); const day = date.getDate().toString().padStart(2, '0'); const hours = date.getHours().toString().padStart(2, '0'); const minutes = date.getMinutes().toString().padStart(2, '0'); const seconds = date.getSeconds().toString().padStart(2, '0'); return `${month}/${day} ${hours}:${minutes}:${seconds}`; } catch (error) { return 'Parse Error'; } };

// --- コンポーネント本体 ---
export default function PracticePage() {
  // --- State定義 ---
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [adviceTestLoading, setAdviceTestLoading] = useState(false);
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<'D' | 'I'>('D');
  const [swingResult, setSwingResult] = useState<SwingDataFromApi | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [targetMetrics, setTargetMetrics] = useState<ClusterMedianData | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<SwingDataFromApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    // 🟢 まず unlockAudio
    const unlockAudio = async (): Promise<boolean> => {
      if (isAudioUnlocked || typeof window === 'undefined') {
        return true;
      }
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    
        await Promise.resolve(); // ★ここが重要：次のタスクに確実に進む
    
        setIsAudioUnlocked(true);
        return true;
      } catch (error) {
        console.warn("Silent audio context unlock failed:", error);
        return false;
      }
    };
    
  
    // 🔵 そのあと playSoundEffect
    const playSoundEffect = async (soundFile: string) => {
      const unlocked = await unlockAudio();
      if (!unlocked) {
        console.warn("Sound unlock failed, skipping sound effect playback.");
        return;
      }
      try {
        const sound = new Audio(soundFile);
        sound.setAttribute('playsinline', '');
        await sound.play();
      } catch (e) {
        console.error(`Failed to load sound effect ${soundFile}:`, e);
      }
    };
  
    // 🔵 さらにそのあと handleUnlockAndTTSForAdviceTest
    const handleUnlockAndTTSForAdviceTest = async () => {
      const unlocked = await unlockAudio();
      if (!unlocked) {
        setError("音声再生の準備ができませんでした。もう一度タップしてください。");
        return;
      }
      await handleGenerateAdviceTest();
    };
  
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);



  // --- Ref定義 ---
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      console.log("Stopping previous audio playback.");
      currentAudioRef.current.pause();
      currentAudioRef.current.removeAttribute('src');
      currentAudioRef.current.load();
      currentAudioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setIsTtsPlaying(false);
  };

  const playTTS = async (text: string) => {
    if (!isTtsEnabled) return;
  
    await unlockAudio(); // 🟢🟢 ここ追加！ボタン押したらすぐAudioContextを起動する
  
    stopCurrentAudio();
    setIsTtsPlaying(true);
    setError(null);
  
    try {
      console.log("Fetching TTS for:", text);
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
  
      if (!res.ok) {
        let errorData: { error?: string } = {};
        try { errorData = await res.json(); } catch {}
        throw new Error(errorData.error || `TTS API error: ${res.status}`);
      }
  
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      currentBlobUrlRef.current = url;
      const audio = new Audio(url);
      audio.setAttribute('playsinline', '');
      currentAudioRef.current = audio;
  
      const cleanup = () => {
        setIsTtsPlaying(false);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        if (currentBlobUrlRef.current === url) {
          URL.revokeObjectURL(url);
          currentBlobUrlRef.current = null;
        }
      };
  
      audio.onended = () => {
        console.log("TTS playback finished.");
        cleanup();
      };
      audio.onerror = (e) => {
        console.error("TTS playback error:", e);
        setError("音声の再生中にエラーが発生しました。");
        cleanup();
      };
  
      console.log("Starting TTS playback...");
      await audio.play();
  
    } catch (e) {
      console.error("TTS process error:", e);
      setError(e instanceof Error ? `TTSエラー: ${e.message}` : "TTS処理中に不明なエラーが発生しました。");
      stopCurrentAudio();
    }
  };
    

  // --- データ取得・処理関数 ---
  const handleMeasureSwing = async () => {
    await unlockAudio();
    playSoundEffect('/golf.mp3');
    setIsLoading(true);
    setError(null);
    setSwingResult(null);
    setClusterInfo(null);
    setTargetMetrics(null);
    setAdviceText(null);
    stopCurrentAudio();
    try {
      const clubTypeParam = selectedClub === "D" ? "driver" : "iron";
      const apiUrl = `/api/single-swing?clubType=${clubTypeParam}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        let errorData: { error?: string } = {};
        try { errorData = await response.json(); } catch {}
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: SwingDataFromApi = await response.json();
      setSwingResult(data);
      
      // 簡単アドバイスをfetchしてセット！
      const simpleAdvice = await fetchSimpleAdvice(data);
      
      // 練習履歴に、advice付きで保存！
      setPracticeHistory(prev => [
        {
          ...data,
          advice: simpleAdvice,
        },
        ...prev
      ].slice(0, 10));
      if (data.swing_cluster_unified !== null) {
        const clusterId = data.swing_cluster_unified;
        const clusterIdStr = clusterId.toString();
        const foundCluster = clustersData.find(c => c.cluster_id.toString() === clusterIdStr);
        setClusterInfo(foundCluster || null);
        const foundMedians = clusterMediansTyped.find(m => m.cluster_id.toString() === clusterIdStr);
        setTargetMetrics(foundMedians || null);
      } else {
        setClusterInfo(null);
        setTargetMetrics(null);
      }
      if (data) {
        const faceAngleValue = data.impactFaceAngle;
        let faceAngleText = '不明';
        if (faceAngleValue !== null && faceAngleValue !== undefined) {
          const angleAbs = Math.abs(faceAngleValue).toFixed(1);
          if (faceAngleValue > 1.9) faceAngleText = `${angleAbs}度 オープン`;
          else if (faceAngleValue < -1.9) faceAngleText = `${angleAbs}度 クローズ`;
          else faceAngleText = `ほぼ スクエア`;
        }
        const summaryText = `推定飛距離 ${data.estimateCarry?.toFixed(0)}ヤード、ヘッドスピード ${data.impactHeadSpeed?.toFixed(1)}、フェース角は ${faceAngleText} です。`;
        playTTS(summaryText);
      }
    } catch (err) {
      console.error("[PracticePage] Measurement error:", err);
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
      setSwingResult(null);
      setClusterInfo(null);
      setTargetMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAdviceTest = async () => {
    await unlockAudio();
    if (!swingResult) return;
    setAdviceTestLoading(true);
    setAdviceText(null);
    setError(null);
    stopCurrentAudio();
    try {
      const medianData = clusterMediansTyped.find(m => m.cluster_id.toString() === swingResult.swing_cluster_unified?.toString());
      const ecrBg = getHistoryCellBgColor(medianData?.estimateCarry, swingResult.estimateCarry);
      const hsBg = getHistoryCellBgColor(medianData?.impactHeadSpeed, swingResult.impactHeadSpeed);
      const faBg = getHistoryCellBgColor(medianData?.impactFaceAngle, swingResult.impactFaceAngle);
      const cpBg = getHistoryCellBgColor(medianData?.impactClubPath, swingResult.impactClubPath);
      const attBg = getHistoryCellBgColor(medianData?.impactAttackAngle, swingResult.impactAttackAngle);
      let evaluationText: '成功' | '僅差' | '課題' | '不明' = '不明';
      if (swingResult.swing_success === true) evaluationText = '成功';
      else if (swingResult.swing_success === false) {
        const hasBlueBg = [ecrBg, hsBg, faBg, cpBg, attBg].some(bg => bg.includes('blue'));
        evaluationText = hasBlueBg ? '僅差' : '課題';
      }



      const factorsForApi = importanceDataTyped[swingResult.swing_cluster_unified.toString()]
        ?.slice(0, 3)
        .map(item => ({
          featureName: featureNameMap[item.feature] || item.feature,
          importance: item.importance,
          median: item.median,
          actual: swingResult?.[item.feature as keyof SwingDataFromApi] ?? null,
          unit: featureUnitMap[item.feature] || "",
        })) ?? [];
      const advicePayload = {
        evaluation: evaluationText,
        swingResult: { estimateCarry: swingResult.estimateCarry, impactHeadSpeed: swingResult.impactHeadSpeed, impactFaceAngle: swingResult.impactFaceAngle, impactClubPath: swingResult.impactClubPath, impactAttackAngle: swingResult.impactAttackAngle, },
        factors: factorsForApi,
        swing_cluster_unified: swingResult.swing_cluster_unified,
      };
      const res = await fetch('/api/generate-advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(advicePayload), });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Advice generation failed');
      }
      const json = await res.json();
      let generatedAdvice = json.advice ?? '---';
      if (generatedAdvice !== '---' && generatedAdvice !== 'アドバイスを取得できませんでした。' && generatedAdvice !== '生成中にエラーが発生') {
        generatedAdvice = generatedAdvice.replace(/^\d+\.\s*/gm, '');
        generatedAdvice = generatedAdvice.replace(/\s*良かった点の発見とほめ言葉:\s*/, '');
        generatedAdvice = generatedAdvice.replace(/\n\s*\n/g, '\n').trim();
      }
      setAdviceText(generatedAdvice);
      if (generatedAdvice !== '---' && generatedAdvice !== 'アドバイスを取得できませんでした。' && generatedAdvice !== '生成中にエラーが発生') {
        playTTS(generatedAdvice);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? `アドバイス生成エラー: ${e.message}` : 'アドバイス生成中にエラーが発生');
      setAdviceText(null);
    } finally {
      setAdviceTestLoading(false);
    }
  };

  const handleResetHistory = () => {
    stopCurrentAudio();
    setPracticeHistory([]);
    setSwingResult(null);
    setClusterInfo(null);
    setTargetMetrics(null);
    setAdviceText(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  // --- JSX ---
  return (
    <>
      <Header />
      <main className="min-h-screen px-2 sm:px-6 md:px-8 md:max-w-none mx-auto pb-16 bg-[#0a0e1a] text-white">
      <h1 className="text-xl font-semibold mb-2 text-center md:text-left">プラクティスモード (Real Time Swing Advisor)</h1>
        {/* 操作エリア */}
        <section className="mb-2 p-4 bg-card rounded-lg shadow-md flex items-center justify-between gap-4 flex-wrap">
          {/* クラブ選択 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">練習クラブ:</span>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button type="button" onClick={() => setSelectedClub('D')} disabled={isLoading || isTtsPlaying} className={`px-4 py-1.5 text-sm font-semibold rounded-l-md transition-colors duration-150 ${selectedClub === 'D' ? 'bg-accent text-white z-10 ring-1 ring-accent' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'}`}> ドライバー </button>
              <button type="button" onClick={() => setSelectedClub('I')} disabled={isLoading || isTtsPlaying} className={`px-4 py-1.5 text-sm font-semibold rounded-r-md transition-colors duration-150 ${selectedClub === 'I' ? 'bg-accent text-white z-10 ring-1 ring-accent' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'}`}> アイアン </button>
            </div>
          </div>

          {/* 右側のボタン群 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* AI音声 トグル */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newState = !isTtsEnabled;
                  setIsTtsEnabled(newState);
                  if (!newState) {
                    stopCurrentAudio();
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-gray-900 ${isTtsEnabled ? 'bg-accent' : 'bg-gray-600'}`}
              >
                 <span className="sr-only">音声 {isTtsEnabled ? 'ON' : 'OFF'}</span>
                 <span className={`${isTtsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </button>
              <span className="text-sm text-gray-400 flex items-center">
                AI音声
                {isTtsPlaying && (
                  <span className="ml-2 flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </span>
            </div>
            {/* 詳細アドバイスボタン */}
            <button
              onClick={handleUnlockAndTTSForAdviceTest}
              disabled={adviceTestLoading || isLoading || !swingResult || isTtsPlaying}
              className={`px-6 py-2 rounded-3xl text-white font-semibold shadow-md transition duration-150 ease-in-out ${adviceTestLoading || isLoading || !swingResult || isTtsPlaying ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-800 to-pink-500 hover:from-purple-700 hover:to-pink-700 text-white'} disabled:opacity-50`}
            >
               {adviceTestLoading ? 'AIがアドバイスを生成中…' : 'AI解析アルゴリズムでスイング分析'}
            </button>
            {/* 測定ボタン */}
            <button
              onClick={handleMeasureSwing}
              disabled={isLoading || isTtsPlaying}
              className={`px-6 py-2 rounded-3xl text-white font-semibold shadow-md transition duration-150 ease-in-out ${isLoading || isTtsPlaying ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-900 to-green-500 hover:from-green-700 hover:to-green-400'} disabled:opacity-50`}
            >
               {isLoading ? "測定中..." : "M-tracerAIでスイングをクラスタ測定"}
            </button>
          </div>
        </section>

        {/* 結果表示エリア */}
        <section> {/* ★ 結果表示エリア全体を囲む <section> */}
          {/* エラー表示エリア (共通) */}
          {error && (
            <div className="mb-2 p-4 bg-red-900 bg-opacity-60 border border-red-700 text-red-200 rounded-md shadow-lg">
              <p className="font-semibold">エラーが発生しました:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* ローディング・初期状態表示 */}
          {isLoading && (<div className="text-center py-10"><p className="text-yellow-400 text-lg animate-pulse">測定中...</p></div>)}
          {!isLoading && !swingResult && !error && (<div className="text-xl text-center py-10 text-gray-500"><p>「M-tracerAIでスイングをクラスタ測定」ボタンを押してください。</p></div>)}

          {/* 結果表示 */}
          {!isLoading && swingResult && ( // ← 条件分岐の開始
            // このブロック全体を囲むフラグメントは不要 (すぐ下に複数のsectionが続くため)
            <>
              {/* クラスタ情報 */}
              <section className="mb-2 bg-card px-4 py-3 rounded-lg shadow-lg">
                  <h2 className="text-sm font-medium text-gray-400 mb-1">スイング判定 クラスタタイプ:</h2>
                  {clusterInfo ? (
                      <>
                          <h3 className="text-2xl font-bold text-white">{clusterInfo.cluster_name}</h3>
                          <p className="mt-1 text-sm text-gray-300 max-w-xl">{clusterInfo.overview}</p>
                          <p className="text-xs text-gray-500 mt-1">(判定クラスタID: {swingResult.swing_cluster_unified})</p>
                      </>
                  ) : (
                      <p className="text-gray-400">クラスタ情報不明</p>
                  )}
              </section>

              {/* 左右比較 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <div className="bg-card p-3 rounded-lg shadow-lg">
                  <h2 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1 text-white">今回のスイング結果</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MetricCard label="推定飛距離" value={swingResult.estimateCarry ?? 'N/A'} unit="yd" />
                    <MetricCard label="ヘッドスピード" value={swingResult.impactHeadSpeed ?? 'N/A'} unit="m/s" />
                    <MetricCard label="クラブパス" value={swingResult.impactClubPath ?? 'N/A'} unit="°" />
                    <MetricCard label="フェース角" value={swingResult.impactFaceAngle ?? 'N/A'} unit="°" />
                    <MetricCard label="フェーストゥパス" value={swingResult.faceToPath ?? 'N/A'} unit="°" />
                    <MetricCard label="アタック角" value={swingResult.impactAttackAngle ?? 'N/A'} unit="°" />
                  </div>
                </div>
                <div className="bg-card p-3 rounded-lg shadow-lg">
                  <h2 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1 text-white">成功者の指標 (目標)</h2>
                  {targetMetrics ? (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">タイプ「{clusterInfo?.cluster_name || '不明'}」の成功スイング時中央値</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <MetricCard label="推定飛距離" value={targetMetrics.estimateCarry ?? 'N/A'} unit="yd" />
                        <MetricCard label="ヘッドスピード" value={targetMetrics.impactHeadSpeed ?? 'N/A'} unit="m/s" />
                        <MetricCard label="クラブパス" value={targetMetrics.impactClubPath ?? 'N/A'} unit="°" />
                        <MetricCard label="フェース角" value={targetMetrics.impactFaceAngle ?? 'N/A'} unit="°" />
                        <MetricCard label="フェーストゥパス" value={targetMetrics.faceToPath ?? targetMetrics.impactRelativeFaceAngle ?? 'N/A'} unit="°" />
                        <MetricCard label="アタック角" value={targetMetrics.impactAttackAngle ?? 'N/A'} unit="°" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">目標指標データを取得できませんでした。</p>
                  )}
                </div>
              </div>

              {/* 詳細アドバイス表示エリア */}
              <section className="mb-2 bg-card p-4 rounded-lg shadow-inner min-h-[80px]">
                <h3 className="text-lg font-semibold mb-2 text-white">M-tracerAIによる詳細アドバイス</h3>
                {adviceTestLoading && (<p className="text-gray-400 italic animate-pulse">AIがアドバイスを生成中...</p>)}
                {adviceText && !adviceTestLoading ? (
                   <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{adviceText}</p>
                ) : !adviceTestLoading && !error && swingResult && !adviceText ? (
                   <p className="text-sm text-gray-500 italic">上の「AI解析アルゴリズムでスイング分析」ボタンを押すと、AIがコメントを生成します。</p>
                ) : null }
              </section>

              {/* 改善ポイントテーブル */}
              {swingResult.swing_cluster_unified !== undefined && (
                <section className="mb-8">
                  <SuccessFactorsTable factors={ importanceDataTyped[swingResult.swing_cluster_unified.toString()] ?.slice(0, 3) .map((item) => ({ feature: featureNameMap[item.feature] || item.feature, importance: item.importance, median: item.median, actual: swingResult?.[item.feature as keyof SwingDataFromApi] ?? null, unit: featureUnitMap[item.feature] || "", })) ?? [] } />
                </section>
              )}

              {/* 練習履歴テーブル */}
              <section> {/* ← 練習履歴テーブルの開始セクション */}
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xl font-semibold">練習履歴 ({practiceHistory.length}件)</h2>
                   <button onClick={handleResetHistory} disabled={practiceHistory.length === 0 || isLoading || isTtsPlaying} className="px-4 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"> 履歴リセット </button>
                 </div>
                <div className="bg-card rounded-lg shadow-lg overflow-x-auto">
                   {practiceHistory.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">ここに練習履歴が表示されます...</p>
                   ) : (
                     <table className="w-full min-w-[860px] md:min-w-full text-sm text-left">
                       <thead className="bg-header text-xs text-gray-400 uppercase"><tr><th scope="col" className="px-2 py-2 font-medium w-24">{historyHeaderMap.fetchedAt}</th><th scope="col" className="px-1 py-2 font-medium max-w-40">{historyHeaderMap.swingType}</th><th scope="col" className="px-1 py-2 font-medium text-right w-20">{historyHeaderMap.estimateCarry}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactHeadSpeed}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactFaceAngle}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactClubPath}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactAttackAngle}</th><th scope="col" className="px-1 py-2 font-medium text-center w-16">{historyHeaderMap.evaluation}</th><th scope="col" className="px-2 py-2 font-medium w-64">{historyHeaderMap.advice}</th></tr></thead>
                       <tbody className="divide-y divide-gray-700">{
                         practiceHistory.map((swing, index) => {
                           const clusterIdStr = swing.swing_cluster_unified?.toString(); const clusterInfoHist = clustersData.find(c => c.cluster_id.toString() === clusterIdStr); const swingTypeName = clusterInfoHist?.cluster_name || '不明'; const medianData = clusterMediansTyped.find(m => m.cluster_id.toString() === clusterIdStr); const ecrBg = getHistoryCellBgColor(medianData?.estimateCarry, swing.estimateCarry); const hsBg = getHistoryCellBgColor(medianData?.impactHeadSpeed, swing.impactHeadSpeed); const faBg = getHistoryCellBgColor(medianData?.impactFaceAngle, swing.impactFaceAngle); const cpBg = getHistoryCellBgColor(medianData?.impactClubPath, swing.impactClubPath); const attBg = getHistoryCellBgColor(medianData?.impactAttackAngle, swing.impactAttackAngle);
                           let evaluationText = '不明'; let evaluationClass = 'bg-gray-500 text-gray-200'; if (swing.swing_success === true) { evaluationText = '成功'; evaluationClass = 'bg-accent text-white'; } else if (swing.swing_success === false) { const hasBlueBg = [ecrBg, hsBg, faBg, cpBg, attBg].some(bg => bg.includes('blue')); if (hasBlueBg) { evaluationText = '僅差'; evaluationClass = 'bg-green-900 text-yellow-100'; } else { evaluationText = '課題'; evaluationClass = 'bg-red-950 text-red-100'; } }
                           return (
                             <tr key={swing.id ? `${swing.id}-${index}` : index} className="hover:bg-gray-700/30">
<td className="px-2 py-1.5 whitespace-nowrap">{formatDateTime(swing.fetchedAt)}</td>
<td className="px-2 py-1.5" title={`Cluster ID: ${clusterIdStr ?? 'N/A'}`}>{swingTypeName}</td>
                               <td className={`px-2 py-1.5 text-right font-medium text-white rounded ${ecrBg}`}>{swing.estimateCarry?.toFixed(1) ?? '---'} yd</td>
                               <td className={`px-2 py-1.5 text-right font-medium text-white rounded ${hsBg}`}>{swing.impactHeadSpeed?.toFixed(1) ?? '---'} m/s</td>
                               <td className={`px-2 py-1.5 text-right font-medium text-white rounded ${faBg}`}>{swing.impactFaceAngle?.toFixed(1) ?? '---'}°</td>
                               <td className={`px-2 py-1.5 text-right font-medium text-white rounded ${cpBg}`}>{swing.impactClubPath?.toFixed(1) ?? '---'}°</td>
                               <td className={`px-2 py-1.5 text-right font-medium text-white rounded ${attBg}`}>{swing.impactAttackAngle?.toFixed(1) ?? '---'}°</td>
                               <td className="px-2 py-1.5 text-center"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${evaluationClass}`}>{evaluationText}</span></td>
                               <td className="px-2 py-1.5 text-gray-400 text-xs">{swing.isGeneratingAdvice ? (<span className="italic text-gray-500">生成中...</span>) : (swing.advice || '(未生成)')}</td>
                             </tr>
                           );
                         })
                       }</tbody>
                     </table>
                   )}
                </div>
              </section> {/* ← 練習履歴テーブルの終了セクション */}
            </>
          )} {/* ← ★★★ 条件分岐 `!isLoading && swingResult` の閉じ括弧 `)}` ★★★ */}
         </section> {/* ← 結果表示エリア全体の終了セクション */}
        {/* OpenAI 連携テストセクションは削除 */}
      </main>
      <footer className="text-center text-sm text-gray-400 py-4 bg-[#0a0e1a]">
        © 2024 M-tracer AI Swing Lab
      </footer>
    </> // ← 全体を囲むフラグメントの閉じタグ
  ); // ← return 文の閉じ括弧
} // ← コンポーネント定義の閉じ括弧