// utils/faceContrib.ts
export interface RawSwing {
  halfwaybackFaceAngleToVertical: number;
  topFaceAngleToHorizontal: number;
  halfwaydownFaceAngleToVertical: number;
  downSwingShaftRotationMax: number;
  downSwingShaftRotationMin: number;
  impactHandFirst: number;
  impactLieAngle: number;
  addressLieAngle: number;
}

export interface Baseline {
  HB: number;
  Closure: number;
  SRDelta: number;
  HD: number;
  HandFirst: number;
  LieDelta: number;
}

/* --- 係数（後で調整しやすい形で一か所に） --- */
const COEF = {
  Closure: 0.0150,
  SRDelta: -0.00050,
  HD: 0.135 + 0.0040,
  HandFirst: -0.398 + 0.060,   // 角度版
  LieDelta: 0.121,
  constant: -2.70 + 3.30
};

/* --- メイン関数：棒・青線・ピンク線を生成 --- */
export function calcFaceChart(s: RawSwing, b: Baseline) {
  const deltas = {
    Closure:  COEF.Closure * ((s.topFaceAngleToHorizontal - s.halfwaydownFaceAngleToVertical) - b.Closure),
    SRDelta:  COEF.SRDelta * ((s.downSwingShaftRotationMax - s.downSwingShaftRotationMin) - b.SRDelta),
    HD:       COEF.HD      * (s.halfwaydownFaceAngleToVertical - b.HD),
    HandFirst:COEF.HandFirst * (s.impactHandFirst - b.HandFirst),
    LieDelta: COEF.LieDelta * ((s.impactLieAngle - s.addressLieAngle) - b.LieDelta)
  };

  /* 棒データ */
  const bars = [
    { name: "HB", value: 0 },  // HB 寄与は 0
    { name: "Closure",   value: deltas.Closure },
    { name: "SRΔ",       value: deltas.SRDelta },
    { name: "HD",        value: deltas.HD },
    { name: "HandFirst", value: deltas.HandFirst },
    { name: "LieΔ",      value: deltas.LieDelta },
  ];

  /* 累積ライン */
  const order = ["HB","Closure","SRΔ","HD","HandFirst","LieΔ"] as const;
  const yourLine:number[]=[COEF.constant], modelLine:number[]=[COEF.constant];

  // あなた累積
  let c = COEF.constant;
  order.forEach((k,i)=>{
    if(k!=="HB") c += (bars[i].value);
    yourLine.push(c);
  });

  // 成功モデル累積
  let m = COEF.constant + COEF.Closure*b.Closure;
  modelLine.push(m);                               // 点:Closure
  m += COEF.SRDelta*b.SRDelta;  modelLine.push(m); // 点:SRΔ
  m += COEF.HD*b.HD;            modelLine.push(m); // 点:HD
  m += COEF.HandFirst*b.HandFirst; modelLine.push(m); // 点:HandFirst
  m += COEF.LieDelta*b.LieDelta; modelLine.push(m);   // 点:LieΔ → FA

  return { bars, yourLine, modelLine };
}
