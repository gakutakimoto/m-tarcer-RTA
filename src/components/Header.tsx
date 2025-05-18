// -----------------------------------------------------------------------------
// src/components/Header.tsx   ★ 左2段＋右ボタン横並び版 ★
//   ▷ 『シミュレートモード』ボタンの遷移先を /simulate → /rta に変更
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ------------------------- ナビメニュー定義 ------------------------- */
// href が画面遷移先、label が表示文字列。
// ▼ ここでシミュレートモードの遷移先を /rta に差し替え ▼
const modes = [
  { href: "/practice", label: "プラクティスモード" },
  { href: "/",          label: "データビューモード"   },
  { href: "/rta",       label: "RTAシミュレートモード"   },
] as const;

/* =================================================================== */
export default function Header() {
  const pathname = usePathname();
  const current  = pathname === "" ? "/" : pathname;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0e1a] shadow-md px-4 py-1">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* ───────── 左：タイトル 2 段 ───────── */}
        <div className="flex flex-col leading-tight">
          <h1 className="text-lg md:text-3xl font-nomal text-white">
            M-tracerAI Data Dashboard / Real Time Swing Advisor
          </h1>
          <span className="text-[10px] md:text-lg text-gray-400">
            Golf Swing 3D Motion Sensor M-Tracer by Epson / Last updated:2025
          </span>
        </div>

        {/* ───────── 右：モード切替ボタン横並び ───────── */}
        <nav className="flex gap-2">
          {modes.map((m) => {
            const active = current === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`px-3 py-1 rounded text-xs md:text-sm font-semibold transition
                  ${active
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-gray-800 text-gray-200 hover:bg-gray-700"}`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
// -----------------------------------------------------------------------------
