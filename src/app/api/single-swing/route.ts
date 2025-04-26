// src/app/api/single-swing/route.ts (ロケーションを US に修正)
import { NextRequest, NextResponse } from 'next/server';
import { bigquery } from '@/lib/bigquery';

export async function GET(request: NextRequest) {
  const fetchedAt = new Date().toISOString();

  const { searchParams } = new URL(request.url);
  const clubTypeParam = searchParams.get('clubType');
  console.log("[API /single-swing] Received clubType parameter:", clubTypeParam);

  let clubTypeFilter: 'D' | 'I' | null = null;
  if (clubTypeParam === 'driver') { clubTypeFilter = 'D'; }
  else if (clubTypeParam === 'iron') { clubTypeFilter = 'I'; }
  else {
     console.warn(`[API /single-swing] Invalid or missing clubType parameter: ${clubTypeParam}.`);
     return NextResponse.json( { error: 'Invalid or missing clubType parameter. Use "driver" or "iron".' }, { status: 400 });
  }

  const whereClause = `WHERE club_type = '${clubTypeFilter}'`;
  console.log("[API /single-swing] Applying WHERE clause:", whereClause);

  // BigQueryのテーブル名が正しいか確認（スクリーンショットと一致しているようです）
  const tableName = "`m-tracer-data-dashboard.m_tracer_swing_data.m-tracer-dataset`";
  const query = `
    SELECT
      id, swing_cluster_unified, estimateCarry, impactHeadSpeed,
      impactGripSpeed, impactClubPath, impactFaceAngle, impactAttackAngle,
      impactRelativeFaceAngle AS faceToPath,
      swing_success, club_type,
      addressHandFirst, addressLieAngle, halfwaydownFaceAngleToVertical,
      downSwingShaftRotationMax, halfwaybackFaceAngleToVertical,
      topFaceAngleToHorizontal, downSwingShaftRotationMin
    FROM ${tableName}
    ${whereClause} ORDER BY RAND() LIMIT 1
  `;

  try {
    console.log("[API /single-swing] Executing BigQuery query:", query);
    // --- ★↓↓↓ ロケーションを 'US' に修正 ↓↓↓★ ---
    const options = {
      query: query,
      location: 'US', // データセットのロケーションに合わせて修正
    };
    // --- ★↑↑↑ ロケーションを 'US' に修正 ↑↑↑★ ---
    const [job] = await bigquery.createQueryJob(options);
    console.log(`[API /single-swing] BigQuery Job ${job.id} started.`);

    const [rows] = await job.getQueryResults();
    console.log("[API /single-swing] BigQuery query results:", rows);

    if (rows.length > 0) {
      const swingData = rows[0];
      swingData.fetchedAt = fetchedAt;

      // 最終送信データのログ出力
      try { console.log("[API /single-swing] Final data being sent (JSON):", JSON.stringify(swingData)); }
      catch (stringifyError) { console.log("[API /single-swing] Final data being sent (Object):", swingData); }

      return NextResponse.json(swingData);
    } else {
      console.error(`[API /single-swing] No swing data found for club_type: ${clubTypeFilter}`);
      return NextResponse.json({ error: `No swing data found for the specified club type (${clubTypeParam}).` }, { status: 404 });
    }
  } catch (error) {
    console.error('[API /single-swing] Error fetching/processing data:', error);
    return NextResponse.json({ error: 'Failed to fetch swing data.', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';