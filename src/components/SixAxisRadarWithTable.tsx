// -----------------------------------------------------------------------------
// components/SixAxisRadarWithTable.tsx
//   左：レーダーカード / 右：テーブル（余白ミニマム版）
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import SixAxisRadarCard from "@/components/SixAxisRadarCard";
import { calcSixAxisScore, SixAxis } from "@/utils/calcSixAxisScore";

/* 6 軸定義 ---------------------------------------------------------- */
const AXES = [
  { key: "halfwaybackFaceAngleToVertical", label: "B:　Halfwayback FaceAngle",  desc: "バックスイングでのフェース開閉量" },
  { key: "halfwaydownFaceAngleToVertical", label: "D:　Halfwaydown FaceAngle", desc: "ダウンスイングでフェースを戻した量" },
  { key: "ClosureAngle",                   label: "C:　Closure Angle",         desc: "フェース変動量(トップ→ダウン)" },
  { key: "SRDelta",                        label: "R:　Shaft Rotation",        desc: "ダウンスイング時シャフト回転量" },
  { key: "impactHandFirst",                label: "H:　Impact Handfirst",      desc: "ハンドファースト角度（-°＝ハンドファースト）" },
  { key: "LieDelta",                       label: "L: 　Lie Delta",             desc: "ライ角変化量 (アドレス→インパクト)" },
] as const;

/* 見た目 ------------------------------------------------------------ */
const FONT = "text-[12px] leading-[16px]";
const CELL = "px-1 py-0.5";

/* props -------------------------------------------------------------- */
type Props = {
  swing: Record<SixAxis, number>;
  clubType: "D" | "I";
};

/* ------------------------------------------------------------------- */
export default function SixAxisRadarWithTable({ swing, clubType }: Props) {
  const rows = AXES.map((a) => {
    const raw   = swing[a.key as SixAxis] ?? 0;
    const score = calcSixAxisScore(a.key as SixAxis, raw, clubType);
    return { ...a, raw, score };
  });

  return (
    <div className="flex flex-col md:flex-row items-start gap-2 w-full">
      {/* ---------- レーダー ---------- */}
      <SixAxisRadarCard swing={swing} clubType={clubType} />

      {/* ---------- テーブル ---------- */}
      <div className="flex-1 rounded-lg bg-[#0e1524] p-2">
        <h3 className="text-sm font-nomal mb-1">
          FaceAngle構成要素&nbsp;6-Axis 偏差値レーダー
        </h3>

        <div
          className={`grid w-full ${FONT} border-t border-gray-600/40`}
          style={{ gridTemplateColumns: "minmax(138px,auto) 66px 64px 1fr" }}
        >
          {/* ヘッダー行 */}
          <span className={`${CELL} text-gray-300`}>項目</span>
          <span className={`${CELL} text-right text-gray-300`}>値</span>
          <span className={`${CELL} text-right text-gray-300`}>偏差値</span>
          <span className={`${CELL} text-gray-300`}>概要</span>

          {/* データ行 */}
          {rows.map((r) => (
            <React.Fragment key={r.key}>
              <span className={`${CELL} break-all`} title={r.desc}>{r.label}</span>

              <span className={`${CELL} text-right`}>
                {r.raw.toFixed(1)}{r.key === "SRDelta" ? "deg/s" : "°"}
              </span>

              <span
                className={`${CELL} text-right ${
                  r.score < 60 ? "text-red-400" : "text-green-300"
                }`}
              >
                {r.score.toFixed(1)}
              </span>

              <span className={`${CELL} text-gray-400 truncate`}>{r.desc}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
// -----------------------------------------------------------------------------
