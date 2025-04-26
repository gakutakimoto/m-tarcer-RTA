// src/types/cluster.d.ts
export interface ClusterMeta {
  cluster_id: number;
  club_type: string;
  cluster_name: string;
  overview: string;
}

// API で取得する指標の型
export interface ClusterMetrics {
  estimateCarry: number;
  impactHeadSpeed: number;
  impactFaceAngle: number;
  impactClubPath: number;
  impactAttackAngle: number;
  // 必要に応じて他の指標も追加
}
