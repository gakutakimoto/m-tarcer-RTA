// /src/app/api/generate-advice/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import featureImportanceData from '@/data/featureImportance.json'; // ここに注意！

const featureNameMap: Record<string, string> = {
  addressHandFirst: "アドレス時のハンドファースト",
  addressLieAngle: "アドレス時のライ角",
  halfwaydownFaceAngleToVertical: "ダウンスイング中間地点のフェース角",
  impactGripSpeed: "インパクト時のグリップスピード",
  downSwingShaftRotationMax: "ダウンスイング最大シャフト回転",
  halfwaybackFaceAngleToVertical: "バックスイング中間地点のフェース角",
  topFaceAngleToHorizontal: "トップ位置でのフェース角",
  downSwingShaftRotationMin: "ダウンスイング最小シャフト回転",
};

export async function POST(req: NextRequest) {
  try {
    const { swingResult, targetProcess } = await req.json();

    if (!swingResult || !targetProcess) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const processName = featureNameMap[targetProcess] || targetProcess;

    const actualValue = swingResult[targetProcess];
    const clusterId = swingResult.swing_cluster_unified?.toString(); // クラスタIDを文字列で取得！

    if (!clusterId) {
      return NextResponse.json({ error: 'Cluster ID missing' }, { status: 400 });
    }

    const clusterData = featureImportanceData[clusterId];
    const targetFeature = clusterData?.find((item: any) => item.feature === targetProcess);

    if (!targetFeature) {
      return NextResponse.json({ error: 'Target feature not found in cluster data' }, { status: 404 });
    }

    const targetMedian = targetFeature.median;
    const diff = actualValue - targetMedian;

    const diffText = diff > 0
      ? `+${diff.toFixed(1)}（目標より大きい）`
      : `${diff.toFixed(1)}（目標より小さい）`;


const prompt = 
  "あなたは世界的に有名なゴルフコーチであり、かつ物理学者です。数多くのプロゴルファーを育成した実績を持っています。\n\n" +
  `アマチュアゴルファー向けに、「${processName}（${targetProcess}）」に関する短いアドバイスを作成してください。\n\n` +
  "【対象状況】\n" +
  `- 現状の値：${actualValue.toFixed(1)}°\n` +
  `- 理想の値：${targetMedian.toFixed(1)}°\n` +
  `- 差分：${diffText}\n\n` +
  "【アドバイス条件】\n" +
  "- この差分を埋めるために意識すべき「具体的な動き」「体の使い方」を必ず提案してください\n" +
  "- 数値（角度、距離、回転数など）を使って、物理的に改善する方法を説明してください\n" +
  "- ネットや専門書籍に記載されているプロフェッショナルなTipsも参考にしてください\n" +
  "- 単なる感覚論ではなく、科学的・物理的根拠を含めてください\n" +
  "- アマチュアにもわかりやすい、シンプルな表現にしてください\n" +
  "- 1つのアドバイスは100文字以内\n" +
  "- 明るく前向きな応援トーンで！\n\n" +
  "【出力指示】\n" +
  "文例：「理想の値40°に対して現状43°なので、アドレスで腰を2cm後ろに引き、グリップを1cm下げると目標に近づくよ！体重配分を意識してね！」";



    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'あなたはプロフェッショナルなゴルフコーチです。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const openaiData = await openaiRes.json();

    if (!openaiData.choices || !openaiData.choices[0]?.message?.content) {
      return NextResponse.json({ error: 'OpenAI応答エラー' }, { status: 500 });
    }

    const advice = openaiData.choices[0].message.content.trim();
    return NextResponse.json({ advice });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
