import { BigQuery } from "@google-cloud/bigquery";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projectId = process.env.BQ_PROJECT_ID!;
    const key = JSON.parse(process.env.BQ_KEY_JSON!);

    const bigquery = new BigQuery({
      projectId,
      credentials: key,
    });

    const query = `
    SELECT impactFaceAngle, estimateCarry
    FROM \`m-tracer-data-dashboard.m_tracer_swing_data.m-tracer-dataset\`
    LIMIT 5
  `;
  

    const [rows] = await bigquery.query({ query });

    return NextResponse.json({ rows });
  } catch (err: any) {
    console.error("BigQuery error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
