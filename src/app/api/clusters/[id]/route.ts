// src/app/api/clusters/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { BigQuery }                  from "@google-cloud/bigquery";
// project ルート直下の data/clusters.json をインポート
import clustersMeta from "../../../../data/clusters.json";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clusterId = Number(params.id);

  // —① JSON からメタ情報を取得—
  const meta = (clustersMeta as Array<{
    cluster_id:  number;
    club_type:   string;
    cluster_name:string;
    overview:    string;
  }>).find((c) => c.cluster_id === clusterId);

  if (!meta) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  // —② BigQuery クライアントを初期化—
  const bq = new BigQuery({
    projectId:   process.env.BQ_PROJECT_ID,
    credentials: JSON.parse(process.env.BQ_KEY_JSON!)
  });

  // —③ クエリを実行—
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
    query:   sql,
    params:  { clusterId }
  });
  const metrics = rows[0] ?? {};

  // —④ 結果を JSON で返却—
  return NextResponse.json({ meta, metrics });
}
