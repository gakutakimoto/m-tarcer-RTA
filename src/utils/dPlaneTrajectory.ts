// -----------------------------------------------------------------------------
// src/utils/dPlaneTrajectory.ts   ★トップ／ダフり補正入り・最新版★
// -----------------------------------------------------------------------------
import * as THREE from "three";

/** Loft が取れない場合のクラブ別デフォルト Launch 角（yard 系） */
const defaultLaunchDeg: Record<"D" | "I", number> = {
  D: 12, // ドライバー
  I: 20, // アイアン
};

/** ミスショット判定用しきい値（すべて “cm” 想定） */
const Y_TOP = -1.63; // 下ヒット 5 パーセンタイル
const Y_FLUSH = 2.17; // 上ヒット 95 パーセンタイル
const ATT_DUFF = -7; // attack ≤ −7° ならダフり候補

/**
 * D-Plane + Magnus の簡易弾道モデル（yard スケール）
 *
 * @param carryYard  推定キャリー（y）
 * @param attackDeg  アタック角（＋アッパー／−ダウン）
 * @param faceDeg    フェース角（＋クローズ）
 * @param pathDeg    スイング軌道角（＋インアウト）
 * @param clubType   'D' ドライバー / 'I' アイアン
 * @param loftDeg    impactLoftAngle（下向き −）
 * @param impactPointY フェース上下打点（cm, +上 −下）★new
 */
export function dPlaneTrajectory(
  carryYard: number,
  attackDeg: number,
  faceDeg: number,
  pathDeg: number,
  clubType: "D" | "I" = "D",
  loftDeg: number | null = null,
  impactPointY: number | null = null, // ★追加
  g = 9.8 / 0.9144, // ＝10.72 yard/s²
  dt = 0.02
): THREE.Vector3[] {
  // ---------- 0. 入力チェック ----------
  if (!Number.isFinite(carryYard) || carryYard <= 0)
    throw new Error(`invalid carry: ${carryYard}`);
  if (!Number.isFinite(faceDeg) || !Number.isFinite(pathDeg))
    throw new Error("angle NaN");
  if (carryYard > 450) throw new Error("carry too big");

  // ---------- 1. Launch 角を決める ----------
  const loftValid = loftDeg !== null && Number.isFinite(loftDeg);
  let launchDeg = loftValid ? (loftDeg as number) + 20 : defaultLaunchDeg[clubType];

  // 高さ 30 % 減＆アタック角 40 % 反映
  launchDeg = launchDeg * 0.7 + attackDeg * 0.4;

  // ---------- 2. 低ロフト × 高キャリー補正（薄いドライバー） ----------
  const lowLineDriver =
    clubType === "D" && loftValid && (loftDeg as number) <= -20 && carryYard >= 180;

  if (lowLineDriver) {
    console.warn("Low-line driver補正:", { loftDeg, carryYard });
    carryYard = Math.min(carryYard * 0.6, 140); // キャリー 60 %
    launchDeg = 8; // 打ち出し 8°
  }

  // ---------- 3. ミスショット補正（トップ／ダフり／上部ヒット） ----------
  if (impactPointY !== null && Number.isFinite(impactPointY)) {
    const y = impactPointY as number;

    // トップ（アッパーブロー + 下ヒット）
    if (attackDeg >= 5 && y <= Y_TOP) {
      launchDeg -= 5;
      carryYard *= 0.90; // 初速低下 ≒ キャリー 10 % 減
    }
    // 薄トップ（軽アッパー + 下ヒット）
    else if (attackDeg > 0 && y <= Y_TOP) {
      launchDeg -= 4;
      carryYard *= 0.95;
    }
    // ダフり（大ダウンブロー）
    else if (attackDeg <= ATT_DUFF && y > -0.5) {
      launchDeg -= 2;
      carryYard *= 0.70;
    }
    // 上部ヒット（フライヤー）
    else if (y >= Y_FLUSH) {
      launchDeg += 3;
      carryYard *= 1.05; // スピン減でやや伸びる
    }
  }

  // 最小 2° / 最大 45° にクランプ
  launchDeg = THREE.MathUtils.clamp(launchDeg, 2, 45);
  let launchRad = THREE.MathUtils.degToRad(launchDeg);

  // ---------- 4. 初速 v0 を逆算 ----------
  const sin2 = Math.sin(2 * launchRad);
  let v0 = Math.sqrt((carryYard * g) / (Math.abs(sin2) > 1e-3 ? sin2 : 1));

  const MAX_V0 = 120; // 120 yd/s ≒ 246 mph
  if (!Number.isFinite(v0) || v0 > MAX_V0) {
    console.warn(`v0 clamped: ${v0.toFixed(1)} → ${MAX_V0}`);
    v0 = MAX_V0;
  }

  // ---------- 5. 水平出球方向 ----------
  const startDirDeg = THREE.MathUtils.clamp(faceDeg * 0.75 + pathDeg * 0.25, -60, 60);
  const startDirRad = THREE.MathUtils.degToRad(startDirDeg);

  // ---------- 6. 初期速度ベクトル ----------
  let v0h = v0 * Math.cos(launchRad);
  let v0y = v0 * Math.sin(launchRad);

  let vx = -v0h * Math.sin(startDirRad); // +x 左
  let vz = v0h * Math.cos(startDirRad); // +z 奥
  let vy = v0y;

  // ---------- 7. Magnus 横加速度 ----------
  const tilt = faceDeg - pathDeg; // Face − Path（+ならドロー）
  const spinTiltRad = THREE.MathUtils.degToRad(tilt * 0.7);

  const successSpin = Math.abs(tilt) >= 8; // |tilt| ≥ 8°
  const kMagnusBase = 0.005;
  const kMagnus = successSpin ? kMagnusBase * 1.4 : kMagnusBase;

  const aSide = kMagnus * v0 * v0 * Math.sin(spinTiltRad); // +左 −右

  // ---------- 8. 数値積分で軌跡生成 ----------
  const pts: THREE.Vector3[] = [];
  for (let t = 0; t < 20; t += dt) {
    vx += aSide * dt;
    vy -= g * dt;

    const last = pts.length ? pts[pts.length - 1] : new THREE.Vector3(0, 0, 0);
    const next = new THREE.Vector3(
      last.x + vx * dt,
      Math.max(last.y + vy * dt, 0),
      last.z + vz * dt
    );
    pts.push(next);
    if (next.y <= 0 && t > 0.02) break; // 地面に着いたら終了
  }

  // ---------- 9. クレンジング ----------
  const clean = pts.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)
  );
  if (clean.length < 3) throw new Error("trajectory collapsed");

  return clean;
}
// -----------------------------------------------------------------------------
// ・Loft ＋ attack から打ち出し角を生成し、30% 低めに補正
// ・impactPointY & attackDeg でトップ / ダフり / フライヤーを再現
// ・Driver 極端低ロフト × 高キャリーは自動でライナー補正
// -----------------------------------------------------------------------------
