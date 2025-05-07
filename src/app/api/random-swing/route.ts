// src/app/api/random-swing/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

const QUERY = `
  SELECT
    club_type            AS clubType,
    estimateCarry,
    impactAttackAngle,
    impactFaceAngle,
    impactLoftAngle,
    impactClubPath,
    impactRelativeFaceAngle,
    impactPointY,
    swing_cluster_unified,
    impactPointY,
    impactPointX
  FROM \`m-tracer-data-dashboard.m_tracer_swing_data.swings_sample_1pct\`
  ORDER BY RAND()
  LIMIT 1
`;

const projectId = "m-tracer-data-dashboard";
const keyJson = JSON.parse(process.env.BQ_KEY_JSON!);

const bq = new BigQuery({
  projectId,
  credentials: keyJson,
});

export async function GET() {
  try {
    const [rows] = await bq.query({
      query: QUERY,        // ← 上で宣言した RAND() 版
      useLegacySql: false, // 標準 SQL
    });

    if (!rows?.length) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("Error fetching random swing:", err);
    return NextResponse.json({ error: "BigQuery query failed" }, { status: 500 });
  }
}
