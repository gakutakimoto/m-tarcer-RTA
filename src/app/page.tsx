// src/app/page.tsx (データビューモード 使用クラブ表示修正 全文 - 省略なし)
"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import MetricCard from "@/components/MetricCard";
import SwingDataTable from "@/components/SwingDataTable";
import ClusterSelector from "@/components/ClusterSelector";
import ClusterDetail from "@/components/ClusterDetail";
import SuccessFactorsTable from "@/components/SuccessFactorsTable";
import featureImportanceData from "@/data/featureImportance.json";
import clustersData from "@/data/clusters.json"; // クラスタ定義 (club_type含む)
import clusterSuccessMedians from "@/data/cluster_success_medians.json";

const PAGE_SIZE = 10;

// --- 型定義 ---
interface SwingListData {
  id: number;
  estimateCarry: number;
  impactHeadSpeed: number;
  impactGripSpeed: number;
  impactClubPath: number;
  impactFaceAngle: number;
  faceToPath: number;
  impactAttackAngle: number;
}
interface SingleSwingData {
  id: number;
  swing_cluster_unified: number;
  estimateCarry: number;
  impactHeadSpeed: number;
  impactGripSpeed: number;
  impactClubPath: number;
  impactFaceAngle: number;
  faceToPath: number;
  impactAttackAngle: number;
  addressHandFirst?: number | null;
  addressLieAngle?: number | null;
  halfwaydownFaceAngleToVertical?: number | null;
  downSwingShaftRotationMax?: number | null;
  halfwaybackFaceAngleToVertical?: number | null;
  topFaceAngleToHorizontal?: number | null;
  downSwingShaftRotationMin?: number | null;
  [key: string]: any;
}
interface ClusterInfo {
  cluster_id: number;
  cluster_name: string;
  overview: string;
  club_type?: string; // ★ 日本語文字列なので string 型
}
interface ClusterMedianData {
  cluster_id: number;
  estimateCarry?: number;
  impactHeadSpeed?: number;
  impactFaceAngle?: number;
  impactClubPath?: number;
  impactAttackAngle?: number;
  impactGripSpeed?: number;
  faceToPath?: number;
  impactRelativeFaceAngle?: number;
  // club_type は clusters.json から取るのでここでは不要
}
const clusterMediansTyped: ClusterMedianData[] = clusterSuccessMedians as ClusterMedianData[];
type ImportanceData = {
  [key: string]: { feature: string; importance: number; median: number }[];
};
const importanceDataTyped = featureImportanceData as ImportanceData;

// --- 定数マップ ---
const featureNameMap: { [key: string]: string } = { addressHandFirst: "アドレス ハンドファースト", addressLieAngle: "アドレス ライ角", halfwaydownFaceAngleToVertical: "ハーフウェイダウン　 フェース角", impactGripSpeed: "インパクト グリップスピード", downSwingShaftRotationMax: "ダウンスイング シャフト回転", halfwaybackFaceAngleToVertical: "ハーフウェイバック　フェース角", topFaceAngleToHorizontal: "トップアングル フェース角", downSwingShaftRotationMin: "ダウンスイング シャフト回転", };
const featureUnitMap: { [key: string]: string } = { addressHandFirst: "", addressLieAngle: "°", halfwaydownFaceAngleToVertical: "°", impactGripSpeed: "m/s", downSwingShaftRotationMax: "dps", halfwaybackFaceAngleToVertical: "°", topFaceAngleToHorizontal: "°", downSwingShaftRotationMin: "dps", estimateCarry: "yd", impactHeadSpeed: "m/s", impactClubPath: "°", impactFaceAngle: "°", faceToPath: "°", impactAttackAngle: "°", impactRelativeFaceAngle: "°" };

// --- コンポーネント本体 ---
export default function DataViewPage() {
  // --- State定義 ---
  const [summary, setSummary] = useState<any>(null);
  const [swings, setSwings] = useState<SwingListData[]>([]);
  const [page, setPage] = useState(1);
  const [selectedClusterId, setSelectedClusterId] = useState(0);
  const [selectedClusterInfo, setSelectedClusterInfo] = useState<ClusterInfo | null>(null); // ★ クラスタ情報全体
  const [selectedClusterMedians, setSelectedClusterMedians] = useState<ClusterMedianData | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SingleSwingData | null>(null);
  const [analysisClusterInfo, setAnalysisClusterInfo] = useState<ClusterInfo | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // --- データ取得 Effect ---
  useEffect(() => {
    fetch("/api/summary", { cache: "no-store" })
      .then((res) => { if (!res.ok) throw new Error('サマリー取得失敗'); return res.json(); })
      .then(setSummary)
      .catch(err => { console.error("Error fetching summary:", err); });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setIsLoadingAnalysis(true);
    fetch(`/api/swings?page=${page}&pageSize=${PAGE_SIZE}`, { cache: "no-store", signal })
      .then((res) => { if (!res.ok) throw new Error('スイング一覧取得失敗'); return res.json(); })
      .then((json) => { if (!signal.aborted) setSwings(json.data || []); })
      .catch(err => { if (err.name !== 'AbortError') console.error("Error fetching swings:", err); })
      .finally(() => { if (!signal.aborted) setIsLoadingAnalysis(false); });
    return () => { controller.abort(); };
  }, [page]);

  // --- クラスタID変更時に中央値とクラスタ情報を更新する Effect ---
  useEffect(() => {
    const foundCluster = clustersData.find(c => c.cluster_id === selectedClusterId);
    setSelectedClusterInfo(foundCluster || null); // クラスタ情報更新

    const foundMedians = clusterMediansTyped.find(m => m.cluster_id === selectedClusterId);
    setSelectedClusterMedians(foundMedians || null); // 中央値更新
  }, [selectedClusterId]);

  // --- スイング判定ボタンの処理 ---
  const handleSwingAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisClusterInfo(null); // スイング判定用のクラスタ情報
    try {
      const response = await fetch("/api/single-swing?clubType=driver");
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || "データ取得失敗"); }
      const data: SingleSwingData = await response.json();
      setAnalysisResult(data);
      if (data.swing_cluster_unified !== null && data.swing_cluster_unified !== undefined) {
        const foundCluster = clustersData.find(c => c.cluster_id === data.swing_cluster_unified);
        setAnalysisClusterInfo(foundCluster || null); // スイング判定用のクラスタ情報更新
      } else { setAnalysisClusterInfo(null); }
    } catch (err: any) { console.error("Error during swing analysis:", err); setAnalysisError(err.message || "エラー発生"); }
    finally { setIsLoadingAnalysis(false); }
  };

  // --- JSX ---
  return (
    <>
      <Header />
      <main className="min-h-screen px-4 md:px-8 pb-16 bg-[#0a0e1a] text-white">

        {/* サマリー指標 */}
        {summary ? (
          <section className="mb-8">
            <h2 className="text-lg text-gray-200 mb-2">アクティブユーザーの主要指標 (中央値)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <MetricCard label="推定飛距離" value={summary.estimateCarry ?? 'N/A'} unit="yd" />
              <MetricCard label="ヘッドスピード" value={summary.headSpeed ?? 'N/A'} unit="m/s" />
              <MetricCard label="フェース角" value={summary.faceAngle ?? 'N/A'} unit="°" />
            </div>
          </section>
        ) : ( <p className="text-yellow-500 mb-8">サマリーデータを読み込み中…</p> )}

        {/* スイングデータ一覧 */}
        <section className="mb-10">
          <h2 className="text-lg text-gray-300 mb-4">スイングデータ一覧</h2>
          <SwingDataTable data={swings} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </section>

        {/* M-Tracer クラスタ分析 */}
        <section className="mb-10">
          <h2 className="text-lg text-white font-semibold mb-2">M-Tracer クラスタ分析によるスイングタイプ分類</h2>
          <div className="mb-2">
            <ClusterSelector selectedId={selectedClusterId} onChange={setSelectedClusterId} />
          </div>
          {/* ★ ClusterDetail に selectedClusterInfo を渡すか検討 */}
          <ClusterDetail id={selectedClusterId} />
          {/* クラスタ別中央値表示 */}
          <div className="mt-4 bg-card p-4 rounded-lg shadow-md">
            <h3 className="text-md font-semibold mb-3 border-b border-gray-700 pb-1">
              選択中タイプ ({selectedClusterInfo?.cluster_name || '不明'}) の成功時中央値
            </h3>
            {selectedClusterMedians ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {/* ★ 使用クラブ表示 (selectedClusterInfo から取得) ★ */}
                <MetricCard
                  label="使用クラブ"
                  value={selectedClusterInfo?.club_type || '不明'} // 日本語を直接表示
                />
                <MetricCard label="推定飛距離" value={selectedClusterMedians.estimateCarry ?? 'N/A'} unit="yd" />
                <MetricCard label="ヘッドスピード" value={selectedClusterMedians.impactHeadSpeed ?? 'N/A'} unit="m/s" />
                <MetricCard label="フェース角" value={selectedClusterMedians.impactFaceAngle ?? 'N/A'} unit="°" />
                <MetricCard label="クラブパス" value={selectedClusterMedians.impactClubPath ?? 'N/A'} unit="°" />
                <MetricCard label="アタック角" value={selectedClusterMedians.impactAttackAngle ?? 'N/A'} unit="°" />
                <MetricCard label="フェーストゥパス" value={selectedClusterMedians.faceToPath ?? selectedClusterMedians.impactRelativeFaceAngle ?? 'N/A'} unit="°" />
              </div>
            ) : ( <p className="text-gray-400">このクラスタの中央値データが見つかりません。</p> )}
          </div>
        </section>

        {/* スイング判定セクション */}
        <section className="mb-10 text-center">
          <button onClick={handleSwingAnalysis} disabled={isLoadingAnalysis} className={`px-6 py-2 rounded-3xl text-white font-semibold shadow-md transition duration-150 ease-in-out ${isLoadingAnalysis ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'} disabled:opacity-50`}>
            {isLoadingAnalysis ? "判定中..." : "M-tracer AIであなたのスイングを判定"}
          </button>
          {analysisError && <p className="mt-4 text-red-500">エラー: {analysisError}</p>}
          {analysisResult && (
            <div className="mt-6 space-y-4">
              {analysisClusterInfo && (
                <section className="bg-card p-2 rounded-md shadow-sm text-left">
                  <h2 className="text-xs font-medium text-gray-400 mb-0.5">スイング判定 クラスタタイプ:</h2>
                  <h3 className="text-2xl font-bold text-accent leading-tight">{analysisClusterInfo.cluster_name}</h3>
                  <p className="mt-0.5 text-sm text-gray-300 leading-snug">{analysisClusterInfo.overview}</p>
                </section>
              )}
              <div className="bg-card p-2 rounded-md shadow-md text-left">
                <h3 className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">今回のスイング結果</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-[4px] p-[4px]">
                  <MetricCard label="推定飛距離" value={analysisResult.estimateCarry ?? 'N/A'} unit="yd" />
                  <MetricCard label="ヘッドスピード" value={analysisResult.impactHeadSpeed ?? 'N/A'} unit="m/s" />
                  <MetricCard label="クラブパス" value={analysisResult.impactClubPath ?? 'N/A'} unit="°" />
                  <MetricCard label="フェース角" value={analysisResult.impactFaceAngle ?? 'N/A'} unit="°" />
                  <MetricCard label="フェースtoパス" value={analysisResult.faceToPath ?? 'N/A'} unit="°" />
                  <MetricCard label="アタック角" value={analysisResult.impactAttackAngle ?? 'N/A'} unit="°" />
                </div>
              </div>
              {analysisResult.swing_cluster_unified !== undefined && (
                <div className="mt-4">
                  <SuccessFactorsTable factors={ importanceDataTyped[analysisResult.swing_cluster_unified.toString()] ?.map((item) => ({ feature: featureNameMap[item.feature] || item.feature, importance: item.importance, median: item.median, actual: analysisResult?.[item.feature as keyof SwingDataFromApi] ?? null, unit: featureUnitMap[item.feature] || "", })) ?? [] } />
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="text-center text-sm text-gray-400 py-4">
          © 2024 M-tracer AI Swing Lab
        </footer>
      </main>
    </>
  );
}