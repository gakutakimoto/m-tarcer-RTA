"use client";

import React, { useState } from "react";

interface ProcessAdviceButtonsProps {
  swingResult: any;
  isLoading: boolean;
  isTtsPlaying: boolean;
  stopCurrentAudio: () => void;
  setAdviceText: (text: string) => void;
  setError: (error: string | null) => void;
}

const ProcessAdviceButtons: React.FC<ProcessAdviceButtonsProps> = ({
  swingResult,
  isLoading,
  isTtsPlaying,
  stopCurrentAudio,
  setAdviceText,
  setError,
}) => {
  const [processAdviceText, setProcessAdviceText] = useState<string | null>(null);
  const [selectedProcessLabel, setSelectedProcessLabel] = useState<string | null>(null);
  const [processAdviceLoading, setProcessAdviceLoading] = useState(false);
  const [processAdviceSpeaking, setProcessAdviceSpeaking] = useState(false);

  const unlockAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      await Promise.resolve();
    } catch (e) {
      console.error("AudioContext resume error:", e);
    }
  };

  const playProcessAdviceTTS = async (text: string) => {
    try {
      await unlockAudio();

      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("TTS APIエラー");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.setAttribute('playsinline', '');

      setProcessAdviceSpeaking(true);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setProcessAdviceSpeaking(false);
      };

      await audio.play();
    } catch (error) {
      console.error("playProcessAdviceTTS error:", error);
      setProcessAdviceSpeaking(false);
    }
  };

  const handleProcessAdvice = async (processKey: string, label: string) => {
    if (!swingResult) return;
    try {
      stopCurrentAudio();
      setError(null);
      setSelectedProcessLabel(label);
      setProcessAdviceLoading(true);

      const res = await fetch("/api/generate-advice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swingResult,
          targetProcess: processKey,
        }),
      });

      if (!res.ok) {
        throw new Error("プロセスアドバイス取得失敗");
      }

      const data = await res.json();
      const adviceText = data.advice || "(アドバイス未生成)";
      setProcessAdviceText(adviceText);
      playProcessAdviceTTS(adviceText);

    } catch (error) {
      console.error("handleProcessAdvice error:", error);
      setError("アドバイス生成エラー");
    } finally {
      setProcessAdviceLoading(false);
    }
  };

  const processButtons = [
    { key: "addressHandFirst", label: "アドレス ハンドファースト" },
    { key: "addressLieAngle", label: "アドレス ライ角" },
    { key: "halfwaydownFaceAngleToVertical", label: "ハーフウェイダウン フェース角" },
    { key: "impactGripSpeed", label: "インパクト グリップスピード" },
    { key: "downSwingShaftRotationMax", label: "ダウンスイング シャフト最大回転" },
    { key: "halfwaybackFaceAngleToVertical", label: "バックスイング フェース角" },
    { key: "topFaceAngleToHorizontal", label: "トップアングル フェース角" },
    { key: "downSwingShaftRotationMin", label: "ダウンスイング シャフト回転MIN" },
  ];

  return (
    <section className="mb-6 bg-card p-4 rounded-lg shadow-inner">
      <h3 className="text-lg font-semibold mb-4 text-white">
        AI解析ゴルフアドバイス：クラスタリングと機械学習によるデータ駆動型スイングアドバイス
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {processButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleProcessAdvice(key, label)}
            disabled={isLoading || isTtsPlaying || processAdviceSpeaking || processAdviceLoading}
            className="px-3 py-2 rounded-3xl bg-gradient-to-r from-purple-900 to-pink-600 hover:from-purple-700 hover:to-pink-600 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      {/* アドバイス表示エリア */}
      <div className="min-h-[140px] bg-card p-4 rounded-lg shadow-inner text-gray-100 text-sm whitespace-pre-wrap">
        {selectedProcessLabel && (
          <h4 className="text-base font-bold text-white mb-2">{selectedProcessLabel}</h4>
        )}
        {processAdviceText ? (
          <p>{processAdviceText}</p>
        ) : (
          <p className="text-gray-400 italic">プロセス改善アドバイスがここに表示されます</p>
        )}
      </div>
    </section>
  );
};

export default ProcessAdviceButtons;
