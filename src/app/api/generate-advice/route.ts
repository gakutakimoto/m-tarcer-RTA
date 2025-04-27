import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- (1) ズレが一番大きい項目を選ぶ ---
    const findMostImportantFactor = (factors: {
      featureName: string;
      importance: number;
      median: number;
      actual: number | null;
      unit: string;
    }[]) => {
      if (!factors || factors.length === 0) return null;

      return factors
        .slice(0, 3) // TOP3だけに絞る
        .map(f => ({
          ...f,
          diff: f.actual !== null ? Math.abs(f.actual - f.median) : 0
        }))
        .sort((a, b) => b.diff - a.diff) // 差分大きい順
        [0];
    };

    const selectedFactor = findMostImportantFactor(body.factors);

    if (!selectedFactor) {
      return NextResponse.json({ advice: '練習データが不足しています。' });
    }

    // --- (2) 短いプロンプトを作る ---
    const prompt = `
あなたは明るく元気なゴルフコーチAIです！
以下のスイング結果と練習ポイントを参考に、アマチュアゴルファーへの短いアドバイスを作成してください。

スイング結果:
- 飛距離: ${Number(body.swingResult.estimateCarry ?? 0).toFixed(1)} yd
- ヘッドスピード: ${Number(body.swingResult.impactHeadSpeed ?? 0).toFixed(1)} m/s
- フェース角: ${Number(body.swingResult.impactFaceAngle ?? 0).toFixed(1)}°
- クラブパス: ${Number(body.swingResult.impactClubPath ?? 0).toFixed(1)}°

重点練習項目:
- ${selectedFactor.featureName} (目標 ${selectedFactor.median.toFixed(1)}${selectedFactor.unit}、現在 ${Number(selectedFactor.actual ?? 0).toFixed(1)}${selectedFactor.unit})

指示:
- 1つのポイントに絞って、簡潔なアドバイスを作成
- 日本語で100文字以内
- 明るく前向きなギャル口調で親しみやすく話す
- ただし、数値や技術的アドバイスは冷静かつ正確に伝える（東大生のような知性も感じさせる）
- 「ナイススイング！」や「いい感じ！」などポジティブなリアクションも交える
`;

    // --- (3) OpenAI API呼び出し ---
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // ここは使いたいモデルに合わせてね
        messages: [
          { role: 'system', content: 'あなたは優れたゴルフコーチです。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
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
    console.error('Error generating advice:', error);
    return NextResponse.json({ advice: 'サーバーエラーが発生しました。' });
  }
}
