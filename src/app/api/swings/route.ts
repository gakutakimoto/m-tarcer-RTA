// src/app/api/swings/route.ts
import { NextResponse, NextRequest } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

export async function GET(
  request: NextRequest
) {
  try {
    // クエリパラメータ取得（例: ?page=1&pageSize=10）
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    // BigQuery クライアント初期化
    const bq = new BigQuery({
      projectId: process.env.BQ_PROJECT_ID,
      credentials: JSON.parse(process.env.BQ_KEY_JSON!),
    });

    // スイングデータを取得（id はテーブルの主キー列名に合わせてください）
    const sql = `
      SELECT
        id,
        estimateCarry,
        impactHeadSpeed,
        impactGripSpeed,
        impactClubPath,
        impactFaceAngle,
        impactRelativeFaceAngle AS faceToPath,
        impactAttackAngle
      FROM \`m-tracer-data-dashboard.m_tracer_swing_data.m-tracer-dataset\`
      ORDER BY id
      LIMIT @pageSize
      OFFSET @offset
    `;

    const [rows] = await bq.query({
      query: sql,
      params: { pageSize, offset },
    });

    // フロントが期待する形 { data: SwingData[] }
    return NextResponse.json({ data: rows });

  } catch (error: any) {
    console.error("[API swings] BigQuery error:", error);
    return NextResponse.json(
      { error: "スイングデータの取得に失敗しました。" },
      { status: 500 }
    );
  }
}
