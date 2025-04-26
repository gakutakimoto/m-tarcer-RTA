// src/app/api/summary/route.ts
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

export async function GET() {
  const bq = new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    credentials: JSON.parse(process.env.BQ_KEY_JSON!),
  });
  const sql = `
  SELECT
    c.median_estimateCarry   AS estimateCarry,
    h.median_impactHeadSpeed AS headSpeed,
    f.median_impactFaceAngle AS faceAngle,
    p.median_impactClubPath  AS clubPath,
    l.median_impactLoftAngle AS loftAngle,
    g.median_maxGripSpeed    AS gripSpeed,
    i.median_impactLieAngle  AS lieAngle,
    a.median_impactAttackAngle AS attackAngle
  FROM
    \`m-tracer-data-dashboard.m_tracer_swing_data.estimateCarry_median_view\`   AS c
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.impactHeadSpeed_median_view\` AS h ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.impactFaceAngle_median_view\` AS f ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.median_impactClubPath\`    AS p ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.median_impactLoftAngle\`   AS l ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.median_maxGripSpeed\`      AS g ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.median_impactLieAngle\`    AS i ON TRUE
  JOIN \`m-tracer-data-dashboard.m_tracer_swing_data.median_impactAttackAngle\` AS a ON TRUE
`;


  try {
    const [rows] = await bq.query({ query: sql });
    const summary = rows[0] || {};
    return NextResponse.json(summary);
  } catch (e: any) {
    console.error("[API summary] BigQuery error:", e);
    return NextResponse.json(
      { error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}
