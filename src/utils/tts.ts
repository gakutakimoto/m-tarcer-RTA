// -----------------------------------------------------------------------------
// utils/tts.ts – OpenAI TTS（キャッシュ＆アップロードなしの極シンプル版）
// -----------------------------------------------------------------------------
import OpenAI from "openai";
import { createHash } from "crypto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * text と lang（jp|en）を受け取り、mp3 の data URL を返す
 * 依存：なし（KV / S3 すべて外してあります）
 */
export async function getTTS(
  text: string,
  lang: "jp" | "en" = "jp"
): Promise<string> {
  // md5 ハッシュは今のところファイル名に使うだけ
  const hash = createHash("md5").update(text + lang).digest("hex");

  /* ---------- OpenAI で直接生成 ---------- */
  const res = await openai.audio.speech.create({
    model: "tts-1-1106",
    input: text,
    voice: "nova",
    format: "mp3",
  });

  /* ---------- バイナリを data:URL に直変換 ---------- */
  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString("base64");
  const dataUrl = `data:audio/mpeg;base64,${base64}`;

  return dataUrl;
}
