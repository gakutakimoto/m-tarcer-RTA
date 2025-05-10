/**
 * raw club_type を "D" / "I" の 2 値へ変換
 *
 * ── Driver グループ "D"
 *   • 1W / 2W / 3W / 4W / 5W  (数字+W)
 *   • UT   (ユーティリティ)
 *   • HY   (ハイブリッド)
 *
 * ── Iron  グループ "I"
 *   • 7I / 8I / 9I
 *   • PW / AW / SW / LW などウェッジ系
 *   • その他 (パターなど) もいったん "I"
 */
export function toDI(raw?: string): "D" | "I" {
  if (!raw) return "D"; // 未定義なら D 扱い
  const t = raw.toUpperCase().trim();

  // 数字 + W  (1W〜5W) → D
  if (/^[1-5]W$/.test(t)) return "D";

  // UT / HY → D
  if (t.endsWith("UT") || t.endsWith("HY")) return "D";

  // それ以外は Iron グループ
  return "I";
}
