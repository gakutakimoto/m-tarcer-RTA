// src/components/ClusterDetail.tsx (指標カード表示を削除)
"use client";

import React, { useEffect, useState } from "react";
import clusters from "@/data/clusters.json";
// ★ ClusterMetrics 型が定義されている types/cluster ファイルをインポート
import { ClusterMeta, ClusterMetrics } from "@/types/cluster";
import MetricCard from "./MetricCard";
import { Switch } from "@headlessui/react";

interface Props {
  id: number;
}

export default function ClusterDetail({ id }: Props) {
  // ★ metrics の型を ClusterMetrics | null に修正
  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ★ meta の型アサーションを修正 (存在しない場合に備える)
  const meta = (clusters as ClusterMeta[]).find((c) => c.cluster_id === id);

  // --- 音声再生関数 ---
  const speakBasicInfo = async () => { /* ... (変更なし) ... */ };
  const speakDetailedReview = async () => { /* ... (変更なし) ... */ };

  // --- データ取得 Effect ---
  useEffect(() => {
    setLoading(true);
    setMetrics(null); // IDが変わったら一旦リセット
    fetch(`/api/clusters/${id}`) // APIから指標データを取得
      .then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        // ★ APIが返すデータ構造に合わせて metrics をセットする
        // 例: json が直接 metrics オブジェクトの場合
        setMetrics(json as ClusterMetrics);
        // 例: json が { data: metrics } のような構造の場合
        // setMetrics(json.data as ClusterMetrics);
      })
      .catch((error) => {
        console.error('Error fetching cluster metrics:', error);
        setMetrics(null); // エラー時はnull
      })
      .finally(() => setLoading(false));
  }, [id]); // id が変更されたら再実行

  // --- 自動読み上げ Effect ---
  useEffect(() => {
    // ★ meta もチェックに追加
    if (autoSpeak && meta && metrics && !loading && !isSpeaking) {
      speakBasicInfo();
    }
    // ★ 依存配列に meta を追加
  }, [metrics, autoSpeak, loading, isSpeaking, meta]);


  // ★ meta が見つからない場合の表示を追加
  if (!meta) {
    return <p className="mt-4 text-center text-red-500">選択されたクラスタ情報が見つかりません。</p>;
  }

  // ★ ローディング中の表示を修正
  if (loading) {
    return <p className="mt-2 text-center text-gray-400">指標データを読み込み中...</p>;
  }

  return (
    <div className="mt-2 space-y-4">
      {/* タイトル & 概要 & 操作ボタン */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          Swing type ID {meta.cluster_id}：{meta.cluster_name}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoSpeak} onChange={setAutoSpeak} className={`${autoSpeak ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}>
              <span className="sr-only">自動読み上げ</span>
              <span className={`${autoSpeak ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </Switch>
            <span className="text-sm text-gray-300">自動読み上げ</span>
          </div>
          <button onClick={speakDetailedReview} disabled={isSpeaking || !metrics} className={`px-3 py-1 text-sm rounded-md transition-colors ${isSpeaking || !metrics ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            詳細レビュー
          </button>
        </div>
      </div>
      <p className="text-gray-300">{meta.overview}</p>

      {/* --- ★↓↓↓ 指標中央値 + 使用クラブ 表示部分を削除 ↓↓↓★ --- */}
      {/*
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <MetricCard label="使用クラブ" value={meta.club_type} unit="" />
        <MetricCard label="推定飛距離"      value={metrics?.estimateCarry}      unit="yd"  />
        <MetricCard label="ヘッドスピード"  value={metrics?.impactHeadSpeed}    unit="m/s"/>
        <MetricCard label="フェース角"      value={metrics?.impactFaceAngle}    unit="°"  />
        <MetricCard label="クラブパス"      value={metrics?.impactClubPath}     unit="°"  />
        <MetricCard label="アタック角"      value={metrics?.impactAttackAngle}  unit="°"  />
      </div>
      */}
      {/* --- ★↑↑↑ 指標中央値 + 使用クラブ 表示部分を削除 ↑↑↑★ --- */}

      {/* ★ metrics データが存在しない場合のメッセージを追加 */}
      {!loading && !metrics && (
          <p className="mt-4 text-center text-yellow-500">このクラスタの指標データが見つかりませんでした。</p>
      )}
    </div>
  );
}