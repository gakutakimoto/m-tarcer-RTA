// src/app/practice/page.tsx (詳細アドバイスエリア新設 全文 - 省略なし)
"use client";

import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import MetricCard from '@/components/MetricCard';
import SuccessFactorsTable from "@/components/SuccessFactorsTable";
import clusterSuccessMedians from "@/data/cluster_success_medians.json";
import featureImportanceData from "@/data/featureImportance.json";
import clustersData from "@/data/clusters.json";

// --- 無音アンロック用関数 ---
const unlockAudio = async () => {
  const silent = new Audio('/silence.mp3');
  try { await silent.play(); } catch { /* 無視 */ }
  silent.pause();
};

// --- OpenAI TTS 再生関数 ---
const playTTS = async (text: string) => {
  try {
    const res = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("TTS API error");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.setAttribute('playsinline', '');
    await audio.play();
  } catch (e) {
    console.error("TTS 再生エラー:", e);
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
  const [adviceTestLoading, setAdviceTestLoading] = useState(false); // ★ 詳細アドバイス生成中フラグ
  const [adviceText, setAdviceText] = useState<string | null>(null);    // ★ 詳細アドバイス結果
  const [selectedClub, setSelectedClub] = useState<'D' | 'I'>('D');
  const [swingResult, setSwingResult] = useState<SwingDataFromApi | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [targetMetrics, setTargetMetrics] = useState<ClusterMedianData | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<SwingDataFromApi[]>([]);
  const [error, setError] = useState<string | null>(null); // スイング測定時のエラー

  // --- 関数定義 ---
  const handleMeasureSwing = async () => { try { const shotSound = new Audio('/golf.mp3'); shotSound.play().catch(e => {}); } catch (e) {} setIsLoading(true); setError(null); setSwingResult(null); setClusterInfo(null); setTargetMetrics(null); setAdviceText(null); try { const clubTypeParam = selectedClub === "D" ? "driver" : "iron"; const apiUrl = `/api/single-swing?clubType=${clubTypeParam}`; const response = await fetch(apiUrl); if (!response.ok) { let errorData: { error?: string } = {}; try { errorData = await response.json(); } catch {} throw new Error(errorData.error || `HTTP error! status: ${response.status}`); } const data: SwingDataFromApi = await response.json(); setSwingResult(data); setPracticeHistory(prev => [data, ...prev].slice(0, 10)); if (data.swing_cluster_unified !== null) { const clusterId = data.swing_cluster_unified; const clusterIdStr = clusterId.toString(); const foundCluster = clustersData.find(c => c.cluster_id.toString() === clusterIdStr); setClusterInfo(foundCluster || null); const foundMedians = clusterMediansTyped.find(m => m.cluster_id.toString() === clusterIdStr); setTargetMetrics(foundMedians || null); } else { setClusterInfo(null); setTargetMetrics(null); } if (isTtsEnabled && data) { const faceAngleValue = data.impactFaceAngle; let faceAngleText = '不明'; if (faceAngleValue !== null && faceAngleValue !== undefined) { const angleAbs = Math.abs(faceAngleValue).toFixed(1); if (faceAngleValue > 0.3) { faceAngleText = `${angleAbs}度 オープンです`; } else if (faceAngleValue < -0.3) { faceAngleText = `${angleAbs}度 クローズです`; } else { faceAngleText = `ほぼ スクエアです`; } } const summaryText = `推定飛距離 ${data.estimateCarry?.toFixed(0)}ヤード、ヘッドスピード ${data.impactHeadSpeed?.toFixed(1)}、フェース角は ${faceAngleText}。`; playTTS(summaryText).catch(ttsError => { console.error("Immediate feedback TTS error:", ttsError); }); } } catch (err) { console.error("[PracticePage] Measurement error:", err); setError(err instanceof Error ? err.message : "不明なエラーが発生しました。"); setSwingResult(null); setClusterInfo(null); setTargetMetrics(null); } finally { setIsLoading(false); } };
  const handleGenerateAdviceTest = async () => {
    // モバイルの再生権をアンロック
    await unlockAudio();
    if (!swingResult) return; setAdviceTestLoading(true); setAdviceText(null); setError(null); try { const medianData = clusterMediansTyped.find(m => m.cluster_id.toString() === swingResult.swing_cluster_unified?.toString()); const ecrBg = getHistoryCellBgColor(medianData?.estimateCarry, swingResult.estimateCarry); const hsBg = getHistoryCellBgColor(medianData?.impactHeadSpeed, swingResult.impactHeadSpeed); const faBg = getHistoryCellBgColor(medianData?.impactFaceAngle, swingResult.impactFaceAngle); const cpBg = getHistoryCellBgColor(medianData?.impactClubPath, swingResult.impactClubPath); const attBg = getHistoryCellBgColor(medianData?.impactAttackAngle, swingResult.impactAttackAngle); const isSuccess = swingResult.swing_success === true; let evaluationText: '成功' | '僅差' | '課題' | '不明' = '不明'; if (swingResult.swing_success === true) { evaluationText = '成功'; } else if (swingResult.swing_success === false) { const hasBlueBg = [ecrBg, hsBg, faBg, cpBg, attBg].some(bg => bg.includes('blue')); if (hasBlueBg) { evaluationText = '僅差'; } else { evaluationText = '課題'; } } const factorsForApi = importanceDataTyped[swingResult.swing_cluster_unified.toString()] ?.slice(0, 3) .map(item => ({ featureName: featureNameMap[item.feature] || item.feature, importance: item.importance, median: item.median, actual: swingResult?.[item.feature as keyof SwingDataFromApi] ?? null, unit: featureUnitMap[item.feature] || "", })) ?? []; const advicePayload = { evaluation: evaluationText, swingResult: { estimateCarry: swingResult.estimateCarry, impactHeadSpeed: swingResult.impactHeadSpeed, impactFaceAngle: swingResult.impactFaceAngle, impactClubPath: swingResult.impactClubPath, impactAttackAngle: swingResult.impactAttackAngle, }, factors: factorsForApi, swing_cluster_unified: swingResult.swing_cluster_unified, }; const res = await fetch('/api/generate-advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(advicePayload), }); if (!res.ok) { const errorData = await res.json().catch(() => ({})); throw new Error(errorData.error || 'Advice generation failed'); } const json = await res.json(); let generatedAdvice = json.advice ?? '---'; if (generatedAdvice !== '---' && generatedAdvice !== 'アドバイスを取得できませんでした。' && generatedAdvice !== '生成中にエラーが発生') { generatedAdvice = generatedAdvice.replace(/^\d+\.\s*/gm, ''); generatedAdvice = generatedAdvice.replace(/\s*良かった点の発見とほめ言葉:\s*/, ''); generatedAdvice = generatedAdvice.replace(/\n\s*\n/g, '\n').trim(); } setAdviceText(generatedAdvice); if (isTtsEnabled) { await playTTS(generatedAdvice); } } catch (e) { console.error(e); setError(e instanceof Error ? e.message : 'アドバイス生成中にエラーが発生'); setAdviceText(null); } finally { setAdviceTestLoading(false); } };
  const handleResetHistory = () => { setPracticeHistory([]); setSwingResult(null); setClusterInfo(null); setTargetMetrics(null); setAdviceText(null); setError(null); }; // ★ リセット時に関連Stateもクリア

  // --- JSX ---
  return (
    <>
      <Header />
      <main className="min-h-screen px-4 md:px-8 pb-16 bg-[#0a0e1a] text-white">
        <h1 className="text-xl font-semibold mb-2 text-center md:text-left">プラクティスモード (Real Time Swing Advisor)</h1>
        {/* 操作エリア */}
        <section className="mb-2 p-4 bg-card rounded-lg shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2"> <span className="text-gray-400 text-sm">練習クラブ:</span> <div className="inline-flex rounded-md shadow-sm" role="group"> <button type="button" onClick={() => setSelectedClub('D')} disabled={isLoading} className={`px-4 py-1.5 text-sm font-semibold rounded-l-md transition-colors duration-150 ${selectedClub === 'D' ? 'bg-accent text-white z-10 ring-1 ring-accent' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'}`}> ドライバー </button> <button type="button" onClick={() => setSelectedClub('I')} disabled={isLoading} className={`px-4 py-1.5 text-sm font-semibold rounded-r-md transition-colors duration-150 ${selectedClub === 'I' ? 'bg-accent text-white z-10 ring-1 ring-accent' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 disabled:opacity-50'}`}> アイアン </button> </div> </div>
          {/* ★ 右側のボタン群 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2"> <button type="button" onClick={() => setIsTtsEnabled(!isTtsEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-gray-900 ${isTtsEnabled ? 'bg-accent' : 'bg-gray-600'}`}> <span className="sr-only">音声 {isTtsEnabled ? 'ON' : 'OFF'}</span> <span className={`${isTtsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} /> </button> <span className="text-sm text-gray-400">AI音声</span> </div>
            {/* ★ 詳細アドバイスボタン (操作エリア内に移動) */}
            <button onClick={handleGenerateAdviceTest} disabled={adviceTestLoading || isLoading || !swingResult} className={`px-6 py-2 rounded-3xl text-white font-semibold shadow-md transition duration-150 ease-in-out ${adviceTestLoading || isLoading || !swingResult ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-800 to-pink-500 hover:from-purple-700 hover:to-pink-700 text-white'} disabled:opacity-50`}> {adviceTestLoading ? 'M-tracer AIがアドバイスを生成中…' : 'AI解析アルゴリズムでスイング分析'} </button>
            <button onClick={handleMeasureSwing} disabled={isLoading} className={`px-6 py-2 rounded-3xl text-white font-semibold shadow-md transition duration-150 ease-in-out ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-800 hover:from-purple-600 hover:to-pink-600'} disabled:opacity-50`}> {isLoading ? "測定中..." : "M-tracerAIでスイングをクラスタ測定"} </button>
          </div>
        </section>
        {/* 結果表示エリア */}
        <section>
          {error && (<div className="mb-2 p-4 bg-red-800 bg-opacity-40 text-red-300 rounded-md"><p>エラー: {error}</p></div>)}
          {isLoading && (<div className="text-center py-10"><p className="text-yellow-500">測定中...</p></div>)}
          {!isLoading && !swingResult && !error && (<div className="text-xl text-center py-10 text-gray-500"><p>「クラスタ測定」ボタンを押してください。</p></div>)}
          {!isLoading && swingResult && (
            <>
<section className="mb-2 bg-card px-3 py-2 rounded-lg shadow-lg">
<h2 className="text-sm font-medium text-gray-400">スイング判定 クラスタタイプ:</h2>
                {clusterInfo ? ( <> <h3 className="text-2xl font-bold text-white">{clusterInfo.cluster_name}</h3> <p className="mt-0 text-sm text-gray-300 max-w-xl">{clusterInfo.overview}</p> <p className="text-xs text-gray-500">(判定クラスタID: {swingResult.swing_cluster_unified})</p> </> ) : ( <p className="text-gray-400">クラスタ情報不明</p> )}
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2"> {/* 左右比較 */}
                <div className="bg-card p-2 md:p-2 rounded-lg shadow-lg"> {/* 左 */}
                  <h2 className="text-xl font-semibold mb-1 border-b border-gray-700 pb-2">今回のスイング結果</h2>
                  <h4 className="text-lg font-semibold mb-1 mt-1">主要指標</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1"> <MetricCard label="推定飛距離" value={swingResult.estimateCarry ?? 'N/A'} unit="yd" /> <MetricCard label="ヘッドスピード" value={swingResult.impactHeadSpeed ?? 'N/A'} unit="m/s" /> <MetricCard label="クラブパス" value={swingResult.impactClubPath ?? 'N/A'} unit="°" /> <MetricCard label="フェース角" value={swingResult.impactFaceAngle ?? 'N/A'} unit="°" /> <MetricCard label="フェーストゥパス" value={swingResult.faceToPath ?? 'N/A'} unit="°" /> <MetricCard label="アタック角" value={swingResult.impactAttackAngle ?? 'N/A'} unit="°" /> </div>
                </div>
                <div className="bg-card p-2 md:p-2 rounded-lg shadow-lg"> {/* 右 */}
                  <h2 className="text-xl font-semibold mb-1 border-b border-gray-700 pb-2">成功者の指標 (目標)</h2>
                  {targetMetrics ? (<div> <p className="text-sm text-gray-400 mb-2"> タイプ「{clusterInfo?.cluster_name || '不明'}」の成功スイング時中央値 </p> <div className="grid grid-cols-2 sm:grid-cols-3 gap-1"> <MetricCard label="推定飛距離" value={targetMetrics.estimateCarry ?? 'N/A'} unit="yd" /> <MetricCard label="ヘッドスピード" value={targetMetrics.impactHeadSpeed ?? 'N/A'} unit="m/s" /> <MetricCard label="クラブパス" value={targetMetrics.impactClubPath ?? 'N/A'} unit="°" /> <MetricCard label="フェース角" value={targetMetrics.impactFaceAngle ?? 'N/A'} unit="°" /> <MetricCard label="フェーストゥパス" value={targetMetrics.faceToPath ?? targetMetrics.impactRelativeFaceAngle ?? 'N/A'} unit="°" /> <MetricCard label="アタック角" value={targetMetrics.impactAttackAngle ?? 'N/A'} unit="°" /> </div> </div>) : (<p className="text-gray-400"> 目標指標データを取得できませんでした。 </p>)}
                </div>
              </div>
              {/* ★↓↓↓ 詳細アドバイス表示エリア ↓↓↓★ */}
              <section className="mb-2 bg-card p-4 rounded-lg shadow-inner min-h-[60px]"> {/* 最小高さを設定 */}
                <h3 className="text-lg font-semibold mb-2 text-white">M-tracerAIによる詳細アドバイス</h3>
                {adviceTestLoading && (<p className="text-gray-400 italic">生成中...</p>)}
                {/* ★ adviceText があれば表示、なければボタンの説明などを表示 */}
                {adviceText && !adviceTestLoading ? (
                   <p className="text-sm text-white whitespace-pre-wrap">{adviceText}</p>
                ) : !adviceTestLoading && !error && swingResult ? ( // エラーがなく、結果があり、ロード中でない場合
                   <p className="text-sm text-gray-500 italic">「詳細アドバイス生成」ボタンを押すと、AIがコメントを生成します。</p>
                ) : null }
                {/* エラーがあれば表示 */}
                {!adviceTestLoading && error && ( <p className="text-red-400 text-sm">{error}</p> )}
              </section>
              {/* ★↑↑↑ 詳細アドバイス表示エリア ↑↑↑★ */}

              {/* 改善ポイントテーブル */}
              {swingResult.swing_cluster_unified !== undefined && (
                <section className="mb-8">
                  <SuccessFactorsTable factors={ importanceDataTyped[swingResult.swing_cluster_unified.toString()] ?.slice(0, 3) .map((item) => ({ feature: featureNameMap[item.feature] || item.feature, importance: item.importance, median: item.median, actual: swingResult?.[item.feature as keyof SwingDataFromApi] ?? null, unit: featureUnitMap[item.feature] || "", })) ?? [] } />
                </section>
              )}
              {/* 練習履歴テーブル */}
              <section>
                <div className="flex justify-between items-center mb-2"> <h2 className="text-xl font-semibold">練習履歴 ({practiceHistory.length}件)</h2> <button onClick={handleResetHistory} disabled={practiceHistory.length === 0 || isLoading} className="px-4 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"> 履歴リセット </button> </div>
                <div className="bg-card rounded-lg shadow-lg overflow-x-auto">
                  {practiceHistory.length === 0 ? (<p className="text-gray-400 text-center py-8">ここに練習履歴が表示されます...</p>) : (
                    <table className="w-full min-w-[860px] md:min-w-full text-sm text-left">
                      <thead className="bg-header text-xs text-gray-400 uppercase"><tr><th scope="col" className="px-2 py-2 font-medium w-24">{historyHeaderMap.fetchedAt}</th><th scope="col" className="px-1 py-2 font-medium max-w-40">{historyHeaderMap.swingType}</th><th scope="col" className="px-1 py-2 font-medium text-right w-20">{historyHeaderMap.estimateCarry}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactHeadSpeed}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactFaceAngle}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactClubPath}</th><th scope="col" className="px-1 py-2 font-medium text-right w-24">{historyHeaderMap.impactAttackAngle}</th><th scope="col" className="px-1 py-2 font-medium text-center w-16">{historyHeaderMap.evaluation}</th><th scope="col" className="px-2 py-2 font-medium w-64">{historyHeaderMap.advice}</th></tr></thead>
                      <tbody className="divide-y divide-gray-700">{
                        practiceHistory.map((swing, index) => {
                          const clusterIdStr = swing.swing_cluster_unified?.toString(); const clusterInfoHist = clustersData.find(c => c.cluster_id.toString() === clusterIdStr); const swingTypeName = clusterInfoHist?.cluster_name || '不明'; const medianData = clusterMediansTyped.find(m => m.cluster_id.toString() === clusterIdStr); const ecrBg = getHistoryCellBgColor(medianData?.estimateCarry, swing.estimateCarry); const hsBg = getHistoryCellBgColor(medianData?.impactHeadSpeed, swing.impactHeadSpeed); const faBg = getHistoryCellBgColor(medianData?.impactFaceAngle, swing.impactFaceAngle); const cpBg = getHistoryCellBgColor(medianData?.impactClubPath, swing.impactClubPath); const attBg = getHistoryCellBgColor(medianData?.impactAttackAngle, swing.impactAttackAngle); const isSuccess = swing.swing_success === true;
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
              </section>
            </>
          )}
         </section>
        {/* OpenAI 連携テストセクションは削除 */}
      </main>
      <footer className="text-center text-sm text-gray-400 py-4 bg-[#0a0e1a]">
        © 2024 M-tracer AI Swing Lab
      </footer>
    </>
  );
}