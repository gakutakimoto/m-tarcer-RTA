// -----------------------------------------------------------------------------
// src/app/api/last-swing/route.ts
//  └ 直近 1 スイングを RTA サーバーから取り込み、
//     既存 UI が期待するキー名にマッピングして返すだけの薄い proxy
// -----------------------------------------------------------------------------

import type { NextRequest } from "next/server";

/* ===== BigQuery 時代と同じレスポンス型（一部のみ） ===== */
type SwingData = {
  clubType: "D" | "I";
  estimateCarry: number | null;
  impactHeadSpeed: number | null;
  impactFaceAngle: number;
  impactAttackAngle: number;
  impactLoftAngle: number;
  impactClubPath: number;
  impactRelativeFaceAngle: number;
  impactPointX: number | null;
  impactPointY: number | null;
  swingDate?: string;
};

/* -------- RTA 側 ⇒ SwingData へ詰め替え -------- */
function toSwingData(raw: any): SwingData {
  const angle = raw?.data?.angle?.data ?? {};
  const dist  = raw?.data?.distance?.data ?? {};
  const speed = raw?.data?.speed?.data ?? {};

  /* 数値変換ヘルパ ― "+9.8" → 9.8  , "-1.6" → -1.6 */
  const num = (v: any) => (typeof v === "string" ? parseFloat(v) : v ?? 0);

  return {
    clubType: raw.swing?.club_type?.startsWith("D") ? "D" : "I",
    estimateCarry: dist.carry ?? null,
    impactHeadSpeed: speed.impactHeadSpeed ?? null,
    impactFaceAngle: num(angle.impactFaceAngle),
    impactAttackAngle: num(angle.impactAttackAngle),
    impactLoftAngle:  num(angle.impactLoftAngle),
    impactClubPath:   num(angle.impactClubPath),
    impactRelativeFaceAngle: num(angle.impactRelativeFaceAngle),
    /* RTA API には無いので一旦 0 → 将来追加されたら差し替え */
    impactPointX: 0,
    impactPointY: 0,
    swingDate: raw.swing?.swingDate ?? "",
  };
}

/* ===================== GET ハンドラ ===================== */
export async function GET(req: NextRequest) {
  const uid   = req.nextUrl.searchParams.get("uid");
  const days  = req.nextUrl.searchParams.get("days") ?? "45";

  if (!uid) {
    return Response.json(
      { error: "uid param is required" },
      { status: 400 },
    );
  }

  try {
    const url  = `https://nextjs-last-swing-v2.vercel.app/api/m-tracer` +
                 `?uid=${uid}&days=${days}`;
    const res  = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    if (!json?.success) throw new Error("RTA API returned error");

    return Response.json(toSwingData(json));
  } catch (err) {
    console.error("[last-swing] fetch error", err);
    return Response.json({ error: "fetch failed" }, { status: 500 });
  }
}
// -----------------------------------------------------------------------------
