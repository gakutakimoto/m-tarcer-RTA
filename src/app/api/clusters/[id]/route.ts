// src/app/api/clusters/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import clustersMeta from "../../../../data/clusters.json";

export async function GET(request: NextRequest, context: any) {
  // 第二引数を await して params を取り出す
  const { params } = await context;
  const clusterId = Number(params.id);

  const meta = (clustersMeta as Array<{
    cluster_id: number;
    club_type: string;
    cluster_name: string;
    overview: string;
  }>).find((c) => c.cluster_id === clusterId);

  if (!meta) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  const bq = new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    credentials: JSON.parse(process.env.BQ_KEY_JSON || "{}"),
  });

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

  const [rows] = await bq.query({ query: sql, params: { clusterId } });
  const metrics = rows[0] ?? {};

  return NextResponse.json({ meta, metrics });
}
