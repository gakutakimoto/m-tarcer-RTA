// -----------------------------------------------------------------------------
// components/SummaryPanels.tsx  – 画像を安全に拡大/縮小 (PC レイアウト)
// -----------------------------------------------------------------------------
"use client";

import DynamicFacePanel   from "@/components/DynamicFacePanel";
import DynamicAttackPanel from "@/components/DynamicAttackPanel";
import ImpactPointPanel   from "@/components/ImpactPointPanel";

interface Props {
  clubType: "D" | "I";
  faceAngle: number;
  loftAngle: number;
  pointX: number | null;
  pointY: number | null;
}

export default function SummaryPanels({
  clubType,
  faceAngle,
  loftAngle,
  pointX,
  pointY,
}: Props) {
  /* 画像をどれくらい縮小 / 拡大するか */
  const SCALE = 0.90;   /* 0.90=90% , 1.00=等倍 , 1.10=110% など */

  /* 共通クラス：タイトル＋画像ラッパー */
  const itemCls =
    "flex flex-col items-center gap-0";

  /* 共通クラス：アスペクト比付き外枠（レイアウト担当） */
  const frameCls =
    "w-full max-w-[260px] aspect-[1/1] overflow-visible";

  /* 共通クラス：内側スケールラッパー（transform担当） */
  const imgWrapCls =
    `w-full h-full origin-top transform scale-[${SCALE}] -translate-y-[4.5%]`;

  return (
    <div className="w-full rounded-lg bg-[#0e1524] px-2 py-4">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-y-0">
        {/* ① フェースアングル */}
        <div className={itemCls}>

          <div className={frameCls}>
            <div className={imgWrapCls}>
              <DynamicFacePanel clubType={clubType} faceAngle={faceAngle} />
            </div>
          </div>
        </div>

        {/* ② インパクトロフト */}
        <div className={itemCls}>

          <div className={frameCls}>
            <div className={imgWrapCls}>
              <DynamicAttackPanel clubType={clubType} loftAngle={loftAngle} />
            </div>
          </div>
        </div>

        {/* ③ ミートポイント */}
        <div className={itemCls}>

          <div className={frameCls}>
            <div className={imgWrapCls}>
              <ImpactPointPanel clubType={clubType} pointX={pointX} pointY={pointY} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
// -----------------------------------------------------------------------------
