// src/app/api/generate-advice/route.ts (寄与度考慮プロンプト版)
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ★ フロントエンドから渡されるデータの型を定義 (より厳密に)
interface AdviceRequestBody {
  evaluation: '成功' | '僅差' | '課題' | '不明'; // 評価文字列
  swingResult: { // 今回のスイング結果
    estimateCarry?: number | null;
    impactHeadSpeed?: number | null;
    impactFaceAngle?: number | null;
    impactClubPath?: number | null;
    impactAttackAngle?: number | null;
    // 他にプロンプトで使いたい指標があれば追加
  };
  factors: { // 寄与度上位データ (featureNameは日本語名想定)
    featureName: string;
    importance: number;
    median: number;
    actual: number | string | null; // 実績値 (数値でない場合も考慮)
    unit: string;
  }[];
  swing_cluster_unified?: number | null; // クラスタID
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得し型付け
    const body: AdviceRequestBody = await request.json();
    console.log("[API /generate-advice] Received body:", body); // 受け取ったデータを確認

    // 必須データのチェック
    if (!body.evaluation || !body.swingResult || !body.factors || body.factors.length === 0) {
      console.warn("[API /generate-advice] Missing required data in request body.");
      return NextResponse.json({ error: '必要なスイングデータまたは寄与度データが不足しています。' }, { status: 400 });
    }

    // --- プロンプト組み立て ---
    const systemPrompt = `
あなたは経験豊富なゴルフコーチAIです。
以下のスイングデータおよび成功スイングへの寄与度データに基づき、
アマチュアゴルファーが前向きに改善へ取り組めるような、具体的で分かりやすいアドバイスを生成してください。

# 指示
- 日本語で回答してください。
- アドバイスは以下の3段構成で、合計300文字以内を目安としてください。
- 指導口調ではなく、前向きで親しみやすい女性らしい語り口にしてください。
- 数値の良し悪しは一般的なアマチュアゴルファーを基準に判断してください。

# アドバイス構成
1.  **スイング全体の所感 (50文字程度):** 推定飛距離、ヘッドスピード、フェース角、アタック角などの主要な結果から、今回のスイングの印象を短く述べてください。評価 (${body.evaluation}) も参考にしてください。
2.  **あなたと成功モデルの違い (100〜150文字):** 成功寄与度ランキング上位（特に1位、2位）の項目に注目してください。目標値と実測値の差が大きい、かつ寄与度が高い指標を優先して1つ選び、具体的な修正ポイントや練習方法を簡潔に指摘してください。専門用語には簡単な補足（例: アドレスライ角=構えのクラブ角度）を入れてください。
3.  **良かった点の発見とほめ言葉 (50文字程度):** スイング結果や寄与度データの中から、目標値に近い、または一般的なアマチュアとして良好な数値を1つ見つけて具体的に褒めてください。

# 回答形式
上記の構成に従い、アドバイス文のみを出力してください。
`.trim();

    const userPrompt = `
# スイング結果
- 評価: ${body.evaluation}
- 推定飛距離: ${Number(body.swingResult.estimateCarry ?? 0).toFixed(1)} yd
- ヘッドスピード: ${Number(body.swingResult.impactHeadSpeed ?? 0).toFixed(1)} m/s
- フェース角: ${Number(body.swingResult.impactFaceAngle ?? 0).toFixed(1)}°
- クラブパス: ${Number(body.swingResult.impactClubPath ?? 0).toFixed(1)}°
- アタック角: ${Number(body.swingResult.impactAttackAngle ?? 0).toFixed(1)}°

# 成功寄与度ランキング（クラスタID: ${body.swing_cluster_unified ?? 'N/A'}）
${body.factors.map((f, i) =>
  `- ${i + 1}位: ${f.featureName} (${(f.importance * 100).toFixed(1)}%)｜目標:${f.median.toFixed(1)}${f.unit}｜今回:${Number(f.actual ?? 0).toFixed(1)}${f.unit}`
).join('\n')}
`.trim();
    // --- プロンプト組み立てここまで ---

    console.log("[API /generate-advice] System Prompt:", systemPrompt);
    console.log("[API /generate-advice] User Prompt:", userPrompt);

    // OpenAI API呼び出し
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: 'gpt-4o-mini', // より指示に従いやすいモデルを試す (gpt-3.5-turboでも可)
      max_tokens: 350, // 少し余裕を持たせる
      temperature: 0.7,
      n: 1,
    });

    const advice = chatCompletion.choices[0]?.message?.content?.trim() || "アドバイスを取得できませんでした。";
    console.log("[API /generate-advice] Generated advice:", advice);

    // 生成されたアドバイスを返す
    return NextResponse.json({ advice });

  } catch (error) {
    console.error('[API /generate-advice] Error:', error);
    return NextResponse.json(
      { error: 'アドバイスの生成に失敗しました。', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}