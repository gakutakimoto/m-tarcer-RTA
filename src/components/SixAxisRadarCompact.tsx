// components/SixAxisRadarStandalone.tsx
"use client";

import React, {
  useRef,
  useState,
  useLayoutEffect,
  Fragment,
} from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { calcSixAxisScore, SixAxis } from "@/utils/calcSixAxisScore";

interface Props {
  swing: Record<SixAxis, number>;
  clubType: "D" | "I";
}

/* 軸定義 ------------------------------------------------------------ */
const AXES: { key: SixAxis; label: string; unit?: string; desc: string }[] = [
  { key: "halfwaybackFaceAngleToVertical", label: "HB",       unit: "°",     desc: "バックスイングでのフェース開閉" },
  { key: "ClosureAngle",                   label: "Closure",  unit: "°",     desc: "トップ→HD のフェース変動量" },
  { key: "halfwaydownFaceAngleToVertical", label: "HD",       unit: "°",     desc: "ダウンでフェースを戻した量" },
  { key: "SRDelta",                        label: "SR Δ",     unit: "deg/s", desc: "ダウンスイング時シャフト回転量" },
  { key: "impactHandFirst",                label: "HandF",    unit: "°",     desc: "ハンドファースト量 (0°↓=HF)" },
  { key: "LieDelta",                       label: "Lie Δ",    unit: "°",     desc: "ライ角変化量 (小さいほど良好)" },
];

const SixAxisRadarStandalone: React.FC<Props> = ({ swing, clubType }) => {
  /* ---------- テーブル用データ ---------- */
  const rows = AXES.map((a) => {
    const raw   = swing[a.key] ?? 0;
    const score = calcSixAxisScore(a.key, raw, clubType);
    return { ...a, raw, score };
  });

  /* ---------- レーダー用データ ---------- */
  const radarData = AXES.map((a) => ({
    label: a.label,
    you:   calcSixAxisScore(a.key, swing[a.key] ?? 0, clubType),
    model: 80,
  }));

  /* ---------- 左高さ計測 ---------- */
  const leftRef = useRef<HTMLDivElement | null>(null);
  const [leftHeight, setLeftHeight] = useState<number>(200);

  useLayoutEffect(() => {
    if (!leftRef.current) return;
    setLeftHeight(leftRef.current.offsetHeight);
    const ro = new ResizeObserver(
      ([entry]) => setLeftHeight(entry.contentRect.height)
    );
    ro.observe(leftRef.current);
    return () => ro.disconnect();
  }, [rows.length]);

  /* ---------- JSX ---------- */
  return (
    <div className="flex flex-col lg:flex-row gap-2 items-stretch">
      {/* -------- テーブル -------- */}
      <div
        ref={leftRef}
        className="flex-1 lg:w-7/12 xl:w-1/2 overflow-hidden"
      >
        {/* ヘッダ */}
        <div
          className="grid grid-cols-[48px_64px_48px_auto] gap-x-1
                     text-[12px] leading-[14px] text-gray-400
                     border-b border-gray-600/40 pb-1 mb-1"
        >
          <span>項目</span>
          <span className="text-right">値</span>
          <span className="text-right">偏差</span>
          <span className="truncate">説明</span>
        </div>

        {/* 本体 */}
        <div
          className="grid grid-cols-[48px_64px_48px_auto] gap-x-1
                     text-[12px] leading-[16px]"
        >
          {rows.map((r) => (
            <Fragment key={r.key}>
              <span className="text-gray-200 truncate">{r.label}</span>
              <span className="text-right whitespace-nowrap text-gray-200">
                {r.raw.toFixed(1)}{r.unit ?? ""}
              </span>
              <span
                className={`text-right whitespace-nowrap ${
                  r.score < 60
                    ? "text-red-400"
                    : r.score >= 80
                    ? "text-green-400"
                    : "text-gray-200"
                }`}
              >
                {r.score.toFixed(1)}
              </span>
              <span className="truncate text-white" title={r.desc}>
                {r.desc}
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      {/* -------- レーダーチャート -------- */}
      <div
        className="flex-1 min-w-[140px] min-h-[140px]"
        style={{ height: leftHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="45%"
            outerRadius="85%"
            data={radarData}
            margin={{ top: 0, right: 0, bottom: 8, left: 0 }}
          >
            <PolarGrid stroke="#444" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "#dddddd", fontSize: 14 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#777777", fontSize: 10 }}
              tickFormatter={(v) => (v === 50 ? "avg" : v)}
            />
            <Radar
              name="Success Model"
              dataKey="model"
              stroke="none"
              fill="#ffc9d6"
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Radar
              name="You"
              dataKey="you"
              stroke="#64b5ff"
              fill="#64b5ff"
              fillOpacity={0.45}
              isAnimationActive={false}
            />
            <Tooltip
              formatter={(v: number) => `${v.toFixed(1)} / 100`}
              contentStyle={{
                background: "#1a1a1acc",
                border: "none",
                fontSize: 12,
                color: "#ffffff",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SixAxisRadarStandalone;
