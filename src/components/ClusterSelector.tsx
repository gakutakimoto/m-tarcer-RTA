// src/components/ClusterSelector.tsx
"use client";

import React from "react";
import clusters from "@/data/clusters.json";
import { ClusterMeta } from "@/types/cluster";

interface Props {
  selectedId: number;
  onChange: (id: number) => void;
}

export default function ClusterSelector({ selectedId, onChange }: Props) {
  return (
    // ▼▼▼ ここを修正：mx-auto を削除し、左寄せにする ▼▼▼
    <div className="max-w-3xl">
      <label htmlFor="cluster-select" className="sr-only">
        クラスタ選択
      </label>
      <select
        id="cluster-select"
        value={selectedId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-card text-white p-3 rounded-lg"
      >
        {(clusters as ClusterMeta[]).map((c) => (
          <option key={c.cluster_id} value={c.cluster_id}>
            {`cluster ID ${c.cluster_id} ${c.cluster_name}`}
          </option>
        ))}
      </select>
    </div>
  );
}
