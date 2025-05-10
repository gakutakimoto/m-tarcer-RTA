// -----------------------------------------------------------------------------
// シンプル版：理想値を使わず “取得した値だけ” でアドバイスを生成
// （impactFaceAngle を想定 / tone: gal | plain | coach）
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { swingResult, tone = "gal" } = await req.json();
    const actual = Number(swingResult?.impactFaceAngle ?? 0);   // 現状値のみ

    const toneLabel =
      tone === "plain"  ? "丁寧語"
      : tone === "coach" ? "プロコーチ風"
      : "元気なギャル口調";

    const prompt =
      "あなたは世界的に有名なゴルフコーチであり、かつ物理学者です。数多くのプロゴルファーを育成した実績を持っています。\n\n" +
      "アマチュアゴルファー向けに、「フェース角（impactFaceAngle）」に関する短いアドバイスを作成してください。\n\n" +
      "【対象状況】\n" +
      `- 現状の値：${actual.toFixed(1)}°\n\n` +
      "【アドバイス条件】\n" +
      "- 現状の値を踏まえて、意識すべき「具体的な動き」「体の使い方」を必ず提案してください\n" +
      "- 数値（角度、距離、回転数など）を使って、物理的に改善する方法を説明してください\n" +
      "- ネットや専門書籍に記載されているプロフェッショナルな Tips も参考にしてください\n" +
      "- 単なる感覚論ではなく、科学的・物理的根拠を含めてください\n" +
      "- アマチュアにもわかりやすい、シンプルな表現にしてください\n" +
      "- 1 つのアドバイスは 100 文字以内\n" +
      "- 明るく前向きな応援トーンで！\n\n" +
      "【出力指示】\n" +
      "文例：「現状 43° オープンなので、アドレスでグリップを 1cm かぶせるとスクエアに近づくよ！」\n" +
      `\n※ トーンは ${toneLabel} でお願いします。`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 180,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({
      advice: chat.choices[0].message.content.trim(),
    });
  } catch (err) {
    console.error("[simple-advice] error", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
