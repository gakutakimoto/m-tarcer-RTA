// src/app/api/single-swing/route.ts (club_type フィルタリング追加版)
import { NextRequest, NextResponse } from 'next/server';
import { bigquery } from '@/lib/bigquery';

export async function GET(request: NextRequest) {
  const fetchedAt = new Date().toISOString(); // API処理開始時刻

  // --- クエリパラメータから clubType を取得 ('driver' or 'iron') ---
  const { searchParams } = new URL(request.url);
  const clubTypeParam = searchParams.get('clubType'); // 'driver' or 'iron'
  console.log("[API /single-swing] Received clubType parameter:", clubTypeParam);

  // --- BigQueryの club_type カラム ('D' or 'I') に変換 ---
  let clubTypeFilter: 'D' | 'I' | null = null;
  if (clubTypeParam === 'driver') {
    clubTypeFilter = 'D';
  } else if (clubTypeParam === 'iron') {
    clubTypeFilter = 'I';
  } else {
    console.warn(`[API /single-swing] Invalid or missing clubType parameter: ${clubTypeParam}. Cannot filter by club type.`);
    // clubTypeが指定されない、または不正な場合はエラーにするか、全種別から取得するか選択
    // 今回はエラーを返すようにしてみます
     return NextResponse.json(
        { error: 'Invalid or missing clubType parameter. Please specify "driver" or "iron".' },
        { status: 400 } // Bad Request
     );
  }

  // --- WHERE 句を生成 ---
  const whereClause = `WHERE club_type = '${clubTypeFilter}'`; // club_type カラムで絞り込み
  console.log("[API /single-swing] Applying WHERE clause:", whereClause);


  // --- BigQueryに投げるSQLクエリを構築 ---
  // 取得したいカラムを全て列挙
  const query = `
    SELECT
      id,                           -- スイングID
      swing_cluster_unified,        -- クラスタID
      estimateCarry,                -- 推定飛距離
      impactHeadSpeed,              -- ヘッドスピード
      impactGripSpeed,              -- グリップスピード
      impactClubPath,               -- クラブパス
      impactFaceAngle,              -- フェース角
      impactAttackAngle,            -- アタック角
      impactRelativeFaceAngle AS faceToPath, -- フェースtoパス
      swing_success,                -- 成功フラグ (カラム名確認！)
      club_type,                    -- クラブタイプ (D/I) - フィルタリング用だが念のため取得
      -- 改善ヒントで使うプロセス指標も取得しておく
      addressHandFirst,
      addressLieAngle,
      halfwaydownFaceAngleToVertical,
      downSwingShaftRotationMax,
      halfwaybackFaceAngleToVertical,
      topFaceAngleToHorizontal,
      downSwingShaftRotationMin
      -- 必要なら他のカラムも追加

    FROM
      \`m-tracer-data-dashboard.m_tracer_swing_data.m-tracer-dataset\` -- テーブル名を正確に指定
    ${whereClause}                  -- クラブタイプで絞り込み
    ORDER BY
      RAND()                        -- ランダムに並び替え
    LIMIT 1                         -- 1件だけ取得
  `;

  try {
    console.log("[API /single-swing] Executing BigQuery query:", query);
    const options = {
      query: query,
      location: 'asia-northeast1', // 必要に応じてロケーションを指定
    };
    const [job] = await bigquery.createQueryJob(options);
    console.log(`[API /single-swing] BigQuery Job ${job.id} started.`);

    const [rows] = await job.getQueryResults();
    console.log("[API /single-swing] BigQuery query results:", rows);

    if (rows.length > 0) {
      const swingData = rows[0];
      swingData.fetchedAt = fetchedAt; // 取得時刻を追加
      console.log("[API /single-swing] Returning swing data:", swingData);
      return NextResponse.json(swingData);
    } else {
      // 条件に合うデータが見つからなかった場合
      console.error(`[API /single-swing] No swing data found for club_type: ${clubTypeFilter}`);
      return NextResponse.json(
        { error: `No swing data found for the specified club type (${clubTypeParam}). Please ensure data exists.` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[API /single-swing] Error fetching single swing data from BigQuery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swing data from BigQuery.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';