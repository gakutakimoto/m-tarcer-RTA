// -----------------------------------------------------------------------------
// src/app/api/tts/success/route.ts
//   Total AI Advice – 成功モデルとの差分 & 上位2要因で 150 文字以内アドバイス
// -----------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import featureImportance from "@/data/featureImportance.json";
import clusterMedians from "@/data/cluster_success_medians.json";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Lang = "jp" | "en";

/* ------------------- マッピング ------------------- */
const NAME_JP: Record<string, string> = {
  ClosureAngle: "トップからダウンのフェース角変動量",
  HD:           "ダウンスイングのフェース角戻し量",
  SRDelta:      "シャフト回転",
  LieDelta:     "ライ角変化値",
  HandFirst:    "ハンドファースト",
};
const NAME_EN: Record<string, string> = {
  ClosureAngle: "face change from top",
  HD:           "downswing face-closing",
  SRDelta:      "shaft rotation",
  LieDelta:     "lie change",
  HandFirst:    "hand-first",
};
const UNIT: Record<string,string>={
  ClosureAngle:"°",HD:"°",SRDelta:"°/s",LieDelta:"°",HandFirst:"°"
};

/* ------------------- util ------------------- */
function round1(n:number){return Math.round(n*10)/10;}
function wordCount(s:string){return s.trim().split(/\s+/).length;}

/* ------------------- API ------------------- */
export async function POST(req:NextRequest){
  try{
    const { swingResult, clusterId, lang="jp" }: { swingResult:any; clusterId:number; lang?:Lang } = await req.json();
    if(!swingResult||clusterId==null) return NextResponse.json({error:"missing input"},{status:400});

    /* ----- ギャップ計算 ----- */
    const med = (clusterMedians as any[]).find(m=>m.cluster_id===clusterId)||{};
    const carryGap = round1((swingResult.estimateCarry??0)-(med.estimateCarry??0));
    const faceGap  = round1((swingResult.impactFaceAngle??0)-(med.impactFaceAngle??0));

    /* ----- 上位2要因取得 ----- */
    const fiArr = (featureImportance as any)[clusterId.toString()]||[];
    const top2 = fiArr.slice(0,2);

    const factorLinesJP: string[] = [];
    const factorLinesEN: string[] = [];
    top2.forEach((f:any)=>{
      const key=f.feature as string;
      const nameJP = NAME_JP[key]||key;
      const nameEN = NAME_EN[key]||key;
      const unit   = UNIT[key]||"";
      const actual = round1(swingResult[key]??0);
      const target = round1((med as any)[key]??0);
      const diff   = round1(actual-target);
      const sign   = diff>=0?"+":"";
      factorLinesJP.push(`${nameJP}：現状${actual}${unit} / 理想${target}${unit} / 差分${sign}${diff}${unit}`);
      factorLinesEN.push(`${nameEN}: now ${actual}${unit}, target ${target}${unit}, diff ${sign}${diff}${unit}`);
    });

    /* ----- プロンプト組立 ----- */
    const headerJP = `推定飛距離差 ${carryGap}yd、フェース角差 ${faceGap}°。`;
    const headerEN = `Carry gap ${carryGap}yd, face gap ${faceGap}°.`;

    const promptJP =
      `あなたは世界的に有名なゴルフコーチであり、かつ物理学者です。数多くのプロゴルファーを育成した実績を持っています。\n\n`+
      `以下の情報を参考に、150文字以内で明るい秘書口調の総合アドバイスを2行で作成してください。\n`+
      `【現状】${headerJP}\n`+
      factorLinesJP.map((l,i)=>`要因${i+1}: ${l}`).join("\n")+"\n\n"+
      "【条件】\n"+
      "- 上位2要因について具体的な動きと数値を提案する\n"+
      "- 数字と物理的根拠を含める\n"+
      "- 明るく前向きな秘書口調で！";

    const promptEN =
      `You are a world-class golf coach and physicist. Create one upbeat secretary-style advice in 30 words or less using the data below.\n`+
      `${headerEN}\n`+
      factorLinesEN.join("; ")+".";

    const systemMsg = lang==="jp"?"日本語で回答してください" : "Respond in English";
    const userPrompt = lang==="jp"?promptJP:promptEN;

    /* ----- Chat Completion ----- */
    const chat = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      temperature:0.7,
      max_tokens:180,
      messages:[
        {role:"system",content:systemMsg},
        {role:"user",content:userPrompt}
      ]
    });
    let advice = chat.choices[0].message.content.trim();
    if(lang==="jp" && advice.length>150) advice = advice.slice(0,148)+"…";
    if(lang==="en" && wordCount(advice)>30){
      const words = advice.split(/\s+/).slice(0,30);
      advice = words.join(" ")+" …";
    }

    /* ----- TTS 生成 ----- */
    const tts = await openai.audio.speech.create({
      model:"tts-1-1106",input:advice,voice:"nova",format:"mp3"
    });
    const buf = Buffer.from(await tts.arrayBuffer());
    const url = `data:audio/mpeg;base64,${buf.toString("base64")}`;
    return NextResponse.json({ url, advice });
  }catch(e){
    console.error("[TTS/success] error",e);
    return NextResponse.json({ error:"TTS success failed"},{status:500});
  }
}
