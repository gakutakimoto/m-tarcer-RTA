// -----------------------------------------------------------------------------
// src/app/api/tts/simple/route.ts
//   推定飛距離 / ヘッドスピード / フェース角（オープン or クローズ判定付き）
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { swingResult, lang = "jp" } = await req.json();
    if (!swingResult) {
      return NextResponse.json({ error: "swingResult missing" }, { status: 400 });
    }

    /* ---------- 数値を整形 ---------- */
    const carry = Number(swingResult.estimateCarry ?? 0).toFixed(0);   // yd
    const hs    = Number(swingResult.impactHeadSpeed ?? 0).toFixed(1); // 単位なし
    const faVal = Number(swingResult.impactFaceAngle ?? 0);

    /* ---------- フェース角テキスト ---------- */
    const absFa = Math.abs(faVal).toFixed(1);
    let faceTextJP: string;
    let faceTextEN: string;

    if (Math.abs(faVal) < 1) {
      faceTextJP = "ほぼスクエアです";
      faceTextEN = "almost square";
    } else if (faVal > 0) {
      faceTextJP = `${absFa}°オープンです`;
      faceTextEN = `${absFa} degrees open`;
    } else {
      faceTextJP = `${absFa}°クローズです`;
      faceTextEN = `${absFa} degrees closed`;
    }

    /* ---------- 音声用フルテキスト ---------- */
    const text =
      lang === "en"
        ? `Carry distance ${carry} yards, head speed ${hs}, and face angle ${faceTextEN}.`
        : `推定飛距離 ${carry}ヤード、ヘッドスピード ${hs}、フェース角は ${faceTextJP}`;

    /* ---------- OpenAI TTS ---------- */
    const res = await openai.audio.speech.create({
      model: "tts-1-1106",
      input: text,
      voice: "nova",
      format: "mp3",
    });

    const buf     = Buffer.from(await res.arrayBuffer());
    const dataUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;

    return NextResponse.json({ url: dataUrl });
  } catch (e) {
    console.error("[TTS/simple] error:", e);
    return NextResponse.json({ error: "TTS simple failed" }, { status: 500 });
  }
}
