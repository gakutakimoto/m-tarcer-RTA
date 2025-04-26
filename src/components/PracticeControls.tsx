// src/components/PracticeControls.tsx
"use client";

import React, { useState } from "react";

interface PracticeControlsProps {
  onFetchSwing: (clubType: "D" | "I") => void;
}

export default function PracticeControls({ onFetchSwing }: PracticeControlsProps) {
  const [club, setClub] = useState<"D" | "I">("D");

  return (
    <div className="flex items-center space-x-6 mb-8">
      {/* ① スイング計測イメージ */}
      <div className="relative">
        <img src="/images/m-tracer.png" alt="スイング計測" className="w-32 h-32" />
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center text-sm text-white">
          スイング計測
        </span>
      </div>

      {/* ② クラブ選択ボタン */}
      <div className="flex space-x-4">
        <button
          className={`px-6 py-3 rounded-lg font-semibold ${
            club === "D" ? "bg-blue-200" : "bg-gray-200"
          }`}
          onClick={() => setClub("D")}
        >
          ドライバー
        </button>
        <button
          className={`px-6 py-3 rounded-lg font-semibold ${
            club === "I" ? "bg-blue-200" : "bg-gray-200"
          }`}
          onClick={() => setClub("I")}
        >
          アイアン
        </button>
      </div>

      {/* ③ 説明テキスト */}
      <p className="text-gray-300 flex-1">
        M-tracer AIでスイング計測をします。クラブタイプを選んで「スイング測定」ボタンを押すと、
        BigQueryからランダムに１スイングを取得します。
      </p>

      {/* ④ スイング測定ボタン */}
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        onClick={() => onFetchSwing(club)}
      >
        スイング測定
      </button>
    </div>
  );
}
