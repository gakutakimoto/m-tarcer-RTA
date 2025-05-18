// -----------------------------------------------------------------------------
// components/OverlayHUD.tsx
//   3D 画面上に重ねる HUD
//   – A: クラスタ判定カードのみ表示
//   ★ ヘッダー下に 80px（top-20）スペースを確保
// -----------------------------------------------------------------------------
"use client";

import React from "react";

/* -------- props -------- */
interface Props {
  clusterName: string;
  clusterDesc: string;
}

/* -------- component -------- */
export default function OverlayHUD({ clusterName, clusterDesc }: Props) {
  /* 共通カードクラス（透過ネイビー + ぼかし + 影） */
  const cardCls =
    "backdrop-blur-sm bg-[#0e1524]/30 text-white rounded-lg px-3 py-1 shadow-lg";

  return (
    /* relative 親の中で重ねる */
    <div
      className={`
        absolute inset-x-0 top-4       /* ← 上 80px だけ開ける！ */
        z-20 pointer-events-none
        flex flex-col items-center
      `}
    >
      {/* ---------- A. クラスタ判定カード ---------- */}
      <div className="w-[90%] max-w-3xl pointer-events-auto">
        <div className={cardCls}>
          {/* 1 行目 */}
          <p className="text-xs mb-0 text-shadow">
            スイング判定: あなたのスイングクラスは…
          </p>

          {/* クラスタ名 */}
          <p className="text-lg font-extrabold leading-tight text-shadow">
            {clusterName}
          </p>

          {/* クラスタ概要 */}
          <p className="text-sm mb-1 text-shadow">{clusterDesc}</p>
        </div>
      </div>
    </div>
  );
}
// -----------------------------------------------------------------------------
