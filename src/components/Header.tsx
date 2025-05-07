// -----------------------------------------------------------------------------
// src/components/Header.tsx   ★ 3 モード共通ヘッダ・リファクタ版 ★
// -----------------------------------------------------------------------------
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ------------------------- ナビメニュー定義 ------------------------- */
const modes = [
  { href: "/practice", label: "プラクティスモード" },
  { href: "/",         label: "データビューモード" },
  { href: "/simulate", label: "シミュレートモード" }, // ★ New!
] as const;

/* =================================================================== */
export default function Header() {
  const pathname = usePathname();

  /* ルート "/" は pathname が "" になるケースを吸収 ---------------- */
  const current = pathname === "" ? "/" : pathname;

  return (
    <header className="mb-6 sticky top-0 z-50 bg-[#0a0e1a] shadow-md">
      {/* ---------- タイトル / サブタイトル ---------- */}
      <div className="px-4 py-1">
        <h1 className="text-2xl md:text-3xl font-nomal text-white leading-tight">
          M-tracerAI Data Dashboard / Real Time Swing Advisor
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          Golf Swing 3D Motion Sensor&nbsp;M-Tracer&nbsp;by&nbsp;Epson&nbsp;/&nbsp;Last&nbsp;updated:2025
        </p>
      </div>

      {/* ---------- モード切替ナビ ---------- */}
      <nav className="px-4 py-1">
        <ul className="flex flex-wrap justify-end gap-2">
          {modes.map((m) => {
            const isActive = current === m.href;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={`px-3 py-1 rounded text-sm font-semibold transition
                    ${isActive
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "bg-gray-800 text-gray-200 hover:bg-gray-700"}`}
                >
                  {m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
// -----------------------------------------------------------------------------
// ・3 モード対応（practice / data-view / simulate）
// ・active 判定を usePathname() で一本化
// ・Tailwind クラス整理：blue-600 アクセントで統一
// -----------------------------------------------------------------------------
