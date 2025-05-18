// -----------------------------------------------------------------------------
// components/FaceWaterfall.tsx
//   – 右側 Y 軸 (±30°)・tick に “°” 表示 / 最終 FA ラベルは軸沿い
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Line,
  Tooltip,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";

/* -------------------- props -------------------- */
export interface BarRow {
  name: string;
  delta: number;
}
interface Props {
  bars: BarRow[];       // 7 本（Address, HB は 0°）
  yourLine: number[];   // 8 点（Address〜FA）
  modelLine: number[];  // 8 点
  faActual: number;     // 実測 FA
}

/* -------------------- component -------------------- */
const FaceWaterfall: React.FC<Props> = ({
  bars,
  yourLine,
  modelLine,
  faActual,
}) => {
  /* ---- 表示用データ整形 ---- */
  const names = [...bars.map((b) => b.name), "FA"];
  const fmt = (v?: number) =>
    v != null && isFinite(v) ? v.toFixed(1) : "";

  const data = names.map((label, idx) => {
    const isFA = label === "FA";
    const delta =
      idx < bars.length ? bars[idx].delta : 0; // 最後は高さ 0
    const labelText = isFA
      ? `${fmt(faActual)}°`
      : delta
      ? `${fmt(delta)}°`
      : "";

    return {
      name: label,
      delta,
      your: yourLine[idx] ?? 0,
      model: modelLine[idx] ?? 0,
      label: labelText,
      isFA,
    } as any;
  });

  /* -------------------- render -------------------- */
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 48, left: 0, bottom: 36 }}
      >
        {/* グラデーション定義 */}
        <defs>
          <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ec2f3" />
            <stop offset="100%" stopColor="#4b8bd2" />
          </linearGradient>
          <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0bdbd" />
            <stop offset="100%" stopColor="#d27575" />
          </linearGradient>
          <linearGradient id="faGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b9e8c0" />
            <stop offset="100%" stopColor="#4fae5f" />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#ffffff22" strokeDasharray="2 8" />
        <ReferenceLine y={0} stroke="#aaaaaa" strokeWidth={1} />

        <XAxis
          dataKey="name"
          tick={{ fill: "#ddd", fontSize: 12 }}
          tickLine={false}
          interval={0}
          tickMargin={8}
        />

        {/* ---- 右側 Y 軸 (±30°) ---- */}
        <YAxis
          domain={[-30, 30]}
          orientation="right"
          tick={{ fill: "#ddd" }}
          width={50}
          tickFormatter={(v) => `${v}°`}
        />

        {/* ΔFA バー */}
        <Bar dataKey="delta" barSize={32}>
          {data.map((d: any, i: number) => (
            <Cell
              key={i}
              fill={
                d.isFA
                  ? "url(#faGrad)"
                  : d.delta >= 0
                  ? "url(#posGrad)"
                  : "url(#negGrad)"
              }
            />
          ))}
          <LabelList
            dataKey="label"
            position="insideTop"
            fill="#fff"
            style={{ fontSize: "12px" }}
          />
        </Bar>

        {/* 累積ライン 2 本 */}
        <Line
          type="monotone"
          dataKey="your"
          stroke="#64B5FF"
          strokeWidth={3}
          strokeDasharray="6 6"
          dot={{ r: 4, fill: "#64B5FF" }}
        />
        <Line
          type="monotone"
          dataKey="model"
          stroke="#ffc9d6"
          strokeWidth={3}
          dot={{ r: 4, fill: "#ffc9d6" }}
        />

        {/* 凡例テキスト */}
        <text
          x="98%"
          y="16"
          textAnchor="end"
          fill="#64B5FF"
          fontSize={12}
        >
          Your&nbsp;Face&nbsp;Angle
        </text>
        <text
          x="98%"
          y="32"
          textAnchor="end"
          fill="#ffc9d6"
          fontSize={12}
        >
          Success&nbsp;Swing&nbsp;Model
        </text>

        <Tooltip
          formatter={(v: number) => `${v.toFixed(1)}°`}
          contentStyle={{ background: "#1a1a1aee", border: "none" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default FaceWaterfall;
