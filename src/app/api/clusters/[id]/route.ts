// src/app/api/clusters/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import clustersMeta from "../../../../data/clusters.json";

export async function GET(
  request: NextRequest,
  // ← params を Promise で受け取る！
  { params }: { params: Promise<{ id: string }> }
) {
  // await で展開してから使う
  const { id } = await params;
  const clusterId = Number(id);

  // ① メタ取得
  const meta = (clustersMeta as Array<{
    cluster_id: number;
    club_type: string;
    cluster_name: string;
    overview: string;
  }>).find((c) => c.cluster_id === clusterId);

  if (!meta) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  // ② BigQuery クライアント初期化
  const bq = new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    credentials: JSON.parse(process.env.BQ_KEY_JSON || "{}"),
  });

  // ③ クエリ実行
  const sql = `
    SELECT
      estimateCarry,
      impactHeadSpeed,
      impactFaceAngle,
      impactClubPath,
      impactAttackAngle
    FROM \`${process.env.BQ_PROJECT_ID}.m_tracer_swing_data.cluster_metrics_view\`
    WHERE cluster_id = @clusterId
  `;
  const [rows] = await bq.query({
    query: sql,
    params: { clusterId },
  });
  const metrics = rows[0] ?? {};

  // ④ レスポンス
  return NextResponse.json({ meta, metrics });
}
