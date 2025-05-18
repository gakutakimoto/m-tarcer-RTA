// -----------------------------------------------------------------------------
// components/SixAxisRadar.tsx
//   6-Axis 偏差値レーダーチャート
//   ・外から半径％(outerRadiusPct) と余白px(marginPx) を指定出来る
//   ・デフォ: 半径 80% / 余白 12px
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { calcSixAxisScore, SixAxis } from "@/utils/calcSixAxisScore";

/* ---------- props ---------- */
interface Props {
  swing: Record<SixAxis, number>;
  clubType: "D" | "I";
  outerRadiusPct?: number; // default 80
  marginPx?: number;       // default 12
}

/* ---------- 軸定義 ---------- */
const AXES: { key: SixAxis; label: string }[] = [
  { key: "halfwaybackFaceAngleToVertical", label: "B" },
  { key: "halfwaydownFaceAngleToVertical", label: "D" },
  { key: "impactHandFirst",                label: "H" },
  { key: "LieDelta",                       label: "L" },
  { key: "SRDelta",                        label: "R" },
  { key: "ClosureAngle",                   label: "C" },
];

/* ---------- component ---------- */
export default function SixAxisRadar({
  swing,
  clubType,
  outerRadiusPct = 80,
  marginPx      = 12,
}: Props) {
  const data = AXES.map((a) => ({
    label: a.label,
    you:   calcSixAxisScore(a.key, swing[a.key] ?? 0, clubType),
    model: 80,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="56%"
        outerRadius={`${outerRadiusPct}%`}
        data={data}
        margin={{ top: marginPx, right: marginPx, bottom: marginPx, left: marginPx }}
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
          tick={{ fill: "#777777", fontSize: 6 }}
          tickFormatter={(v) => (v === 50 ? "avg" : v)}
        />

        {/* 成功モデル */}
        <Radar
          dataKey="model"
          stroke="none"
          fill="#ffc9d6"
          fillOpacity={0.35}
          isAnimationActive={false}
        />

        {/* あなた */}
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
  );
}
// -----------------------------------------------------------------------------
