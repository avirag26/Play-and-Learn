import { readSettings } from "@/lib/app-settings";

/** "unsupported": the browser has no speech or audio at all (common in in-app browsers such as WhatsApp's). */
export type AudioResult = "spoken" | "playing" | "muted" | "unsupported" | "unavailable";
/** Called with a short reason code (the browser's own error name) when audio fails after starting. */
export type AudioErrorHandler = (reason: string) => void;

// The Web Speech API does not expose a voice's gender, so match well-known female voice names
// across Windows, macOS/iOS, Android/Chrome and Edge.
const femaleVoiceNames = ["zira", "aria", "jenny", "michelle", "ana", "samantha", "karen", "moira", "tessa", "victoria", "allison", "ava", "susan", "hazel", "libby", "sonia", "natasha", "female", "google us english", "google uk english female"];

// Starting a new sentence cancels the previous one; browsers report that as "interrupted"/"canceled", which is not a failure.
const harmlessErrors = new Set(["interrupted", "canceled"]);

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  // On-device voices first: network voices fail on a weak connection, especially on Android.
  const english = voices.filter((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith("en")).sort((a, b) => Number(b.localService) - Number(a.localService));
  const candidates = english.filter((voice) => !/\bmale\b/i.test(voice.name));
  for (const name of femaleVoiceNames) {
    const match = candidates.find((voice) => voice.name.toLowerCase().includes(name));
    if (match) return match;
  }
  return null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // Some browsers load voices asynchronously; ask early so they are ready by the first tap.
  window.speechSynthesis.getVoices?.();
  // iOS only allows speech that starts during a tap until speech has played once, so a silent
  // utterance on the first tap unlocks the questions that are read out automatically afterwards.
  if (typeof document !== "undefined") {
    const unlock = () => {
      try { const utterance = new SpeechSynthesisUtterance(" "); utterance.volume = 0; window.speechSynthesis.speak(utterance); } catch { /* Speech stays optional. */ }
    };
    for (const type of ["touchend", "click"]) document.addEventListener(type, unlock, { once: true, capture: true });
  }
}

export function speak(text: string, onError?: AudioErrorHandler): "spoken" | "muted" | "unsupported" | "unavailable" {
  if (!readSettings().soundOn) return "muted";
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return "unsupported";
  const makeUtterance = (voice: SpeechSynthesisVoice | null): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = 0.82;
    utterance.pitch = voice ? 1.1 : 1.3;
    utterance.onerror = (event?: SpeechSynthesisErrorEvent) => {
      if (event && harmlessErrors.has(event.error)) return;
      // A chosen voice can be missing or network-only on the phone; retry once with the phone's default voice.
      if (voice) { window.speechSynthesis.speak(makeUtterance(null)); return; }
      onError?.(event?.error ?? "speech-error");
    };
    return utterance;
  };
  try {
    window.speechSynthesis.cancel();
    // Chrome can leave the engine paused after a tab was in the background.
    window.speechSynthesis.resume?.();
    window.speechSynthesis.speak(makeUtterance(pickFemaleVoice()));
    return "spoken";
  } catch { return "unavailable"; }
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
