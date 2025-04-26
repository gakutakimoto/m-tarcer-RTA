// src/app/api/text-to-speech/route.ts (SSMLなし シンプル版 - 全文)
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env.local から APIキーを読み込み
});

// POSTリクエストを処理する非同期関数
export async function POST(request: NextRequest) {
  try {
    // リクエストボディからテキストを取得
    const body = await request.json();
    const text = body.text; // フロントエンドからは { text: "読み上げたい文章" } の形で送る想定

    // テキストが空かどうかの基本的なチェック
    if (typeof text !== 'string' || !text) {
      console.warn("[API /text-to-speech] Text is empty or not a string.");
      return NextResponse.json(
        { error: 'テキストが空か、不正な形式です。' },
        { status: 400 } // Bad Request
      );
    }

    console.log("[API /text-to-speech] Received text:", text.substring(0, 50) + "..."); // 受け取ったテキストの一部をログ出力

    // OpenAI TTS API の呼び出し (input に直接 text を渡す)
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",       // 標準モデル (tts-1-hd より高速・低コスト)
      voice: "nova",        // 声の種類 (alloy, echo, fable, onyx, nova, shimmer)
      input: text,          // SSMLではなく、直接テキストを渡す
      response_format: "mp3", // 出力フォーマット (aac, flac, mp3, opus, pcm, wav も可能)
      // speed: 1.0,        // 再生速度 (0.25から4.0、デフォルト1.0) - 必要なら指定
    });

    console.log("[API /text-to-speech] Successfully generated speech.");

    // 音声データをBufferとして取得
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 音声データをレスポンスとして返す
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg', // MP3形式の場合
        // 'Content-Disposition': `attachment; filename="speech.mp3"`, // ダウンロードさせたい場合
      },
    });

  } catch (error) {
    console.error('[API /text-to-speech] Error generating speech:', error);
    // エラーレスポンスを返す
    return NextResponse.json(
      { error: '音声の生成に失敗しました。', details: error instanceof Error ? error.message : String(error) },
      { status: 500 } // Internal Server Error
    );
  }
}

// このルートはPOSTリクエストのみを受け付けるため、GETなどの他のメソッドは不要
// export const dynamic = 'force-dynamic'; // 必要に応じて設定