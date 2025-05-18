// -----------------------------------------------------------------------------
// components/VoiceAdvisorBar.tsx – 言語ボタンもグラデーションでハイライト
// -----------------------------------------------------------------------------
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { stopCurrentAudio } from "@/utils/ttsHelpers";

type VoiceMode = "off" | "simple" | "zeroFace" | "success";
type Lang      = "jp"  | "en";

interface Props {
  mode:          VoiceMode;
  onChange:     (m: VoiceMode) => void;
  lang:          Lang;
  onLangChange: (l: Lang)      => void;
  disabled?:     boolean;
}

export default function VoiceAdvisorBar({
  mode,
  onChange,
  lang,
  onLangChange,
  disabled = false,
}: Props) {
  /* ---------- 音声モードボタン ---------- */
  const buttons = [
    { key: "off",      label: "Voice OFF" },
    { key: "simple",   label: "SWING Result" },
    { key: "zeroFace", label: "FaceANGLE Guide" },
    { key: "success",  label: "Total AI Advice" },
  ] as const;

  /* ---------- ハイライト制御 ---------- */
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState({ left: 0, width: 0 });
  const activeIdx = useMemo(
    () => buttons.findIndex((b) => b.key === mode),
    [mode]
  );
  useEffect(() => {
    const el = refs.current[activeIdx];
    if (el) setHighlight({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIdx]);

  /* ---------- クリック ---------- */
  const handleClick = (key: VoiceMode) => {
    if (disabled) return;
    const next = key === mode ? "off" : key;
    if (next === "off") stopCurrentAudio();
    onChange(next);
  };

  return (
    <div className="h-[25px] flex items-center justify-between px-2 border-b border-[#1a2335]">
      {/* ===== タイトル + 言語トグル ===== */}
      <div className="flex items-center gap-3">
        <span className="text-lg text-gray-200 select-none">
          Real Time Voice Advisor
        </span>

        {/* ---------- JP / EN トグル ---------- */}
        <div className="inline-flex rounded-lg bg-[#0f1625] p-0.5">
          {(["jp", "en"] as const).map((l) => {
            const active = lang === l;
            return (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                className={`
                  px-3 py-0.5 text-xs font-semibold rounded-lg transition-colors
                  ${active
                    ? "text-white bg-gradient-to-r from-purple-700 to-pink-600"
                    : "text-gray-300 hover:bg-gray-600"}
                `}
              >
                {l.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 音声モードトグル ===== */}
      <div className="relative flex bg-[#0f1625] rounded-lg overflow-hidden">
        {/* ハイライト */}
        <span
          className="absolute top-0 left-0 h-full rounded-lg
                     bg-gradient-to-r from-purple-800 to-pink-500
                     transition-all duration-200"
          style={{
            width: highlight.width,
            transform: `translateX(${highlight.left}px)`,
          }}
        />
        {/* ボタン群 */}
        {buttons.map(({ key, label }, idx) => {
          const isActive = key === mode;
          return (
            <button
              key={label}
              ref={(el) => (refs.current[idx] = el)}
              onClick={() => handleClick(key)}
              disabled={disabled}
              className={`
                relative z-10 px-5 h-6 whitespace-nowrap
                text-[13px] tracking-wide transition-colors
                ${disabled
                  ? "text-gray-500 cursor-not-allowed"
                  : isActive
                    ? "text-white"
                    : "text-gray-300 hover:text-white"}
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
