// src/app/api/clusters/[id]/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import clustersMeta from "../../../../data/clusters.json";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clusterId = Number(params.id);

  // ① メタ情報を JSON から取得
  const meta = (clustersMeta as Array<{
    cluster_id:  number;
    club_type:   string;
    cluster_name:string;
    overview:    string;
  }>).find((c) => c.cluster_id === clusterId);

  if (!meta) {
    return NextResponse.json(
      { error: "Cluster not found" },
      { status: 404 }
    );
  }

  // ② BigQuery クライアント
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

  // ④ JSON で返す
  return NextResponse.json({ meta, metrics });
}
