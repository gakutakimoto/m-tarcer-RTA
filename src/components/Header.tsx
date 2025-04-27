// src/components/Header.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const path = usePathname();

  return (
    <header className="sticky top-0 bg-[#0a0e1a] py-1 mb-2 z-50">
      {/* === Data Dashboard のタイトルエリア === */}
      <div className="px-8">
        <h1 className="text-3xl text-white">
          M‑tracer AI Data Dashboard / Real Time Swing Advisor
        </h1>
        <p className="text-sm text-gray-400 mb-4">
          Golf Swing 3D Motion Sensor M‑Tracer by Epson / Last updated:2025
        </p>
      </div>

      {/* === モード切替ナビリンク === */}
      <div className="font-bold px-8 flex justify-end space-x-2 mt-0">
        <Link
          href="/practice"
          className={`px-4 py-2 rounded text-white ${
            path === "/practice"
              ? "bg-accent hover:bg-blue-500"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          プラクティスモード
        </Link>
        <Link
          href="/"
          className={`px-4 py-2 rounded text-white ${
            path === "/"
              ? "bg-accent hover:bg-blue-500"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          データビューモード
        </Link>
      </div>
    </header>
  );
}
