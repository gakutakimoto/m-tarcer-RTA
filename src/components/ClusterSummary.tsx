// -----------------------------------------------------------------------------
// components/ClusterSummary.tsx
//   クラスタ名 & 概要を 1 行表示
//   hide プロップで非表示にできるよう改良
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import clusters from "@/data/clusters.json";

/* ---------- Props ---------- */
interface Props {
  /** 72 クラスタの ID（数値 or 文字列どちらでも OK） */
  clusterId: number | string;
  /** true のときは描画しない（デフォルト false） */
  hide?: boolean;
}

/* ---------- Component ---------- */
export default function ClusterSummary({ clusterId, hide = false }: Props) {
  if (hide) return null; // ← 非表示フラグが立っていればレンダリングしない

  // JSON 側は文字列キーなので文字列化して比較
  const cl = clusters.find(
    (c: any) => String(c.cluster_id) === String(clusterId)
  );
  if (!cl) return null; // ID が見つからなければ何も描画しない

  return (
    <div className="pt-3 mb-1 pl-3">
      {/* ラベル行 */}
      <p className="text-[11px] leading-none text-gray-400 mb-0.5">
        スイング判定: あなたのスイングクラスタは…
      </p>

      {/* クラスタ名 + 概要（横並び） */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-lg font-bold whitespace-nowrap">
          {cl.cluster_name}
        </h2>
        <p className="text-sm text-gray-200 leading-snug">{cl.overview}</p>
      </div>
    </div>
  );
}
