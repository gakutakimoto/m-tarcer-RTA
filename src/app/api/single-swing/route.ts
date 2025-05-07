// src/app/api/single-swing/route.ts
import { NextResponse } from "next/server";
import { bigquery }    from "@/lib/bigquery";

export async function GET(request: Request) {
  const fetchedAt = new Date().toISOString();
  const { searchParams } = new URL(request.url);
  const clubTypeParam = searchParams.get("clubType");
  console.log("[API /single-swing] Received clubType parameter:", clubTypeParam);

  let clubTypeFilter: "D" | "I" | null = null;
  if (clubTypeParam === "driver") {
    clubTypeFilter = "D";
  } else if (clubTypeParam === "iron") {
    clubTypeFilter = "I";
  } else {
    console.warn(
      `[API /single-swing] Invalid or missing clubType parameter: ${clubTypeParam}.`
    );
    return NextResponse.json(
      { error: 'Invalid or missing clubType parameter. Use "driver" or "iron".' },
      { status: 400 }
    );
  }

  const whereClause = `WHERE club_type = '${clubTypeFilter}'`;
  const tableName = "`m-tracer-data-dashboard.m_tracer_swing_data.m-tracer-dataset`";
  const query = `
    SELECT
      id,
      swing_cluster_unified,
      estimateCarry,
      impactHeadSpeed,
      impactGripSpeed,
      impactClubPath,
      impactFaceAngle,
      impactAttackAngle,
      impactRelativeFaceAngle AS faceToPath,
      swing_success,
      club_type,
      addressHandFirst,
      addressLieAngle,
      halfwaydownFaceAngleToVertical,
      downSwingShaftRotationMax,
      halfwaybackFaceAngleToVertical,
      topFaceAngleToHorizontal,
      impactPointX,
      impactPointY,
      downSwingShaftRotationMin
    FROM ${tableName}
    ${whereClause}
    ORDER BY RAND()
    LIMIT 1
  `;

  try {
    const options = { query, location: "US" };
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    console.log("[API /single-swing] Query results:", rows);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `No swing data found for club_type: ${clubTypeParam}` },
        { status: 404 }
      );
    }

    const swingData = { ...rows[0], fetchedAt };
    return NextResponse.json(swingData);
  } catch (error) {
    console.error("[API /single-swing] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch swing data.", details: String(error) },
      { status: 500 }
    );
  }
}
