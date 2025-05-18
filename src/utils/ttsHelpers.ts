// -----------------------------------------------------------------------------
// utils/ttsHelpers.ts – Audio 再生ユーティリティ（共通で使用）
// -----------------------------------------------------------------------------
let current: HTMLAudioElement | null = null;
let unlocked = false;

/** すでに鳴っている音を止める */
export function stopCurrentAudio() {
  if (current) {
    current.pause();
    current = null;
  }
}

/** 最初の 1 回だけサイレント音を鳴らし、ブラウザの autoplay 制限を解除 */
export async function unlockAudio(): Promise<void> {
  if (unlocked || typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    unlocked = true;
  } catch { /* ignore */ }
}

/** URL をそのまま再生（data: / blob: どちらも可） */
export async function playAudio(url: string) {
  await unlockAudio();                 // ← ここが大事
  stopCurrentAudio();

  current = new Audio(url);
  current.setAttribute("playsinline", "");
  current.volume = 1;

  current.play().catch(err => {
    console.error("[Audio.play] error:", err);
  });
}
