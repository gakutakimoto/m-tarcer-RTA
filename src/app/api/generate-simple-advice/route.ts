import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = `
あなたは明るく前向きなゴルフコーチAIです。
以下のスイング結果を参考に、アマチュアゴルファーへの短いアドバイスを作成してください。

スイング結果:
- 飛距離: ${Number(body.swingResult.estimateCarry ?? 0).toFixed(1)} yd
- ヘッドスピード: ${Number(body.swingResult.impactHeadSpeed ?? 0).toFixed(1)} m/s
- フェース角: ${Number(body.swingResult.impactFaceAngle ?? 0).toFixed(1)}°
- クラブパス: ${Number(body.swingResult.impactClubPath ?? 0).toFixed(1)}°

指示:
- 練習ポイントを、数値を用いて20〜25文字以内で表現してください。
- 例：「フェース角を３°閉じるように意識してみて」「ヘッドスピードあと5m/s上げてみて！」
- 明るく、ポジティブな日本語で！

`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'あなたは優れたゴルフコーチです。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return NextResponse.json({ advice: 'アドバイスを取得できませんでした。' });
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content ?? 'アドバイス生成に失敗しました。';

    return NextResponse.json({ advice });

  } catch (error) {
    console.error('Error generating simple advice:', error);
    return NextResponse.json({ advice: 'サーバーエラーが発生しました。' });
  }
}
