// -----------------------------------------------------------------------------
// src/app/api/tts/zero-face/route.ts
//   FaceAngle Guide (zero-face) – HD / ClosureAngle / SRΔ の最大寄与キーで
//   ワンポイント TTS を生成（JP / EN）
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------- 係数＆テンプレ ------------------------- */
const COEF = {
  Closure: 0.0150,
  SRDelta: -0.00050,
  HD: 0.139 /* 0.135+0.004 */,
};

/* 改善指示テンプレ */
const JP_TEMPLATE: Record<string, (fa: number) => string> = {
HD: (fa) => `フェース角 ${fa.toFixed(1)}°。トップで左手甲を 2°伏せよう！ダウンスイングのフェース角戻し量を 1°閉じればフェース角が約0.14°閉じますよ。`,
Closure: (fa) => `フェース角 ${fa.toFixed(1)}°。切り返しでフェース戻しを 2°抑えて！トップからダウンスイングのフェース角変動量 1°でフェース角が約0.015°改善しますよ`,
SRDelta: (fa) => `フェース角 ${fa.toFixed(1)}°。ダウンで右前腕を 5°ロール！シャフト回転を 100°/s 増やすとフェース角が約0.05°閉じますよ`,
};
const EN_TEMPLATE: Record<string, (fa: number) => string> = {
  HD: (fa) => `Face angle ${fa.toFixed(1)}° open. Bow your lead wrist 2° at the top; one‑degree HD change closes the face about 0.14°.`,
  Closure: (fa) => `Face angle ${fa.toFixed(1)}° open. Reduce closure by 2° in the transition; each degree trims about 0.015° off the face.`,
  SRDelta: (fa) => `Face angle ${fa.toFixed(1)}° open. Add 5° of forearm roll; +100°/s shaft roll closes the face roughly 0.05°.`,
};

/* ------------------------------ API ------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const { swingResult, lang = "jp" } = await req.json();
    if (!swingResult) {
      return NextResponse.json({ error: "swingResult missing" }, { status: 400 });
    }

    /* --- 変数計算 --- */
    const HD = swingResult.halfwaydownFaceAngleToVertical ?? 0;
    const SRDelta = (swingResult.downSwingShaftRotationMax ?? 0) -
                    (swingResult.downSwingShaftRotationMin ?? 0);
    const Closure = (swingResult.topFaceAngleToHorizontal ?? 0) -
                    (swingResult.halfwaydownFaceAngleToVertical ?? 0);

    /* --- 寄与度計算（絶対値最大キーを採用） --- */
    const contrib = {
      HD: COEF.HD * HD,
      SRDelta: COEF.SRDelta * SRDelta,
      Closure: COEF.Closure * Closure,
    } as const;
    const maxKey = Object.keys(contrib)
      .sort((a,b)=>Math.abs((contrib as any)[b]) - Math.abs((contrib as any)[a]))[0] as keyof typeof contrib;

    /* --- テキスト生成 --- */
    const faceAngle = swingResult.impactFaceAngle ?? 0;
    const text = lang === "en"
      ? EN_TEMPLATE[maxKey](faceAngle)
      : JP_TEMPLATE[maxKey](faceAngle);

    /* --- TTS --- */
    const res = await openai.audio.speech.create({
      model: "tts-1-1106",
      input: text,
      voice: "nova",
      format: "mp3",
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const url = `data:audio/mpeg;base64,${buf.toString("base64")}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[TTS/zero-face] error", e);
    return NextResponse.json({ error: "TTS zero-face failed" }, { status: 500 });
  }
}
