// -----------------------------------------------------------------------------
// components/SixAxisRadarStandalone.tsx  – チャート左・テーブル右（PC 専用）
//   • 左: レーダーチャート  (正方形)  最小 240px / 最大 380px
//   • 右: テーブル          (高さに応じてチャートがリサイズ)
// -----------------------------------------------------------------------------
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
  { key: "halfwaybackFaceAngleToVertical", label: "B",       unit: "°",     desc: "バックスイングでのフェース開閉" },
  { key: "ClosureAngle",                   label: "T",  unit: "°",     desc: "トップ→HD のフェース変動量" },
  { key: "halfwaydownFaceAngleToVertical", label: "D",       unit: "°",     desc: "ダウンでフェースを戻した量" },
  { key: "SRDelta",                        label: "R",     unit: "deg/s", desc: "ダウンスイング時シャフト回転量" },
  { key: "impactHandFirst",                label: "H",    unit: "°",     desc: "ハンドファースト量 (0°↓=HF)" },
  { key: "LieDelta",                       label: "L",    unit: "°",     desc: "ライ角変化量 (小さいほど良好)" },
];

export default function SixAxisRadarStandalone({ swing, clubType }: Props) {
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

  /* ---------- テーブル高さ計測 ---------- */
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(240);
  useLayoutEffect(() => {
    if (!tableRef.current) return;
    const ro = new ResizeObserver(([e]) =>
      setTableHeight(e.contentRect.height)
    );
    ro.observe(tableRef.current);
    return () => ro.disconnect();
  }, []);

  /* ---------- チャート枠サイズ ---------- */
  const chartSize = Math.max(140, Math.min(tableHeight, 300)); // 240〜380
  const radiusPx  = Math.round(chartSize * 0.40);

  return (
    <div className="flex gap-2 items-start">
      {/* -------- チャート (左) -------- */}
      <div
        className="flex-none px-2"
        style={{ width: chartSize, height: chartSize }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            key={radiusPx}        /* 高さ変化でリメイク */
            cx="50%"
            cy="50%"
            outerRadius={Math.round(chartSize * 0.40)}
            margin={{ left: 4, right: 4 }}
            data={radarData}
          >
            <PolarGrid stroke="#444" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "#dddddd", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#777777", fontSize: 8 }}
              tickFormatter={(v) => (v === 50 ? "avg" : v)}
            />
            <Radar
              dataKey="model"
              stroke="none"
              fill="#ffc9d6"
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Radar
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

      {/* -------- テーブル (右) -------- */}
      <div
        ref={tableRef}
        className="flex-1 overflow-hidden"
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
                     text-[12px] leading-[18px]"
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
    </div>
  );
}
// -----------------------------------------------------------------------------
