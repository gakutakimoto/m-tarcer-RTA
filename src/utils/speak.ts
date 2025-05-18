// -----------------------------------------------------------------------------
// utils/speak.ts – /api/tts/{mode} を呼び出し、再生まで行うラッパ
// -----------------------------------------------------------------------------
import { playAudio, stopCurrentAudio, unlockAudio } from "@/utils/ttsHelpers";

export async function speak(
  mode: "simple" | "zero-face" | "success",
  payload: Record<string, any>
) {
  try {
    const lang = payload.lang ?? (navigator.language.startsWith("en") ? "en" : "jp");

    const res = await fetch(`/api/tts/${mode}`, {
      method: "POST",
      body: JSON.stringify({ ...payload, lang }),
    });

    if (!res.ok) {
      console.error(`[speak] API error (${mode}):`, res.status);
      return;
    }

    const { url } = (await res.json()) as { url?: string };
    if (!url) {
      console.error("[speak] no url returned");
      return;
    }

    console.log("[speak] TTS url =", url);

    await unlockAudio();   // ← ユーザー操作がなくても再生できるように
    stopCurrentAudio();
    playAudio(url);
  } catch (e) {
    console.error(`[speak] unexpected error (${mode}):`, e);
  }
}
