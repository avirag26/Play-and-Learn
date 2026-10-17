import { readSettings } from "@/lib/app-settings";

export type AudioResult = "spoken" | "playing" | "muted" | "unavailable";

// The Web Speech API does not expose a voice's gender, so match well-known female voice names
// across Windows, macOS/iOS, Android/Chrome and Edge.
const femaleVoiceNames = ["zira", "aria", "jenny", "michelle", "ana", "samantha", "karen", "moira", "tessa", "victoria", "allison", "ava", "susan", "hazel", "libby", "sonia", "natasha", "female", "google us english", "google uk english female"];

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const candidates = english.filter((voice) => !/\bmale\b/i.test(voice.name));
  for (const name of femaleVoiceNames) {
    const match = candidates.find((voice) => voice.name.toLowerCase().includes(name));
    if (match) return match;
  }
  return null;
}

// Some browsers load voices asynchronously; ask early so they are ready by the first tap.
if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices?.();

export function speak(text: string, onError?: () => void): "spoken" | "muted" | "unavailable" {
  if (!readSettings().soundOn) return "muted";
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return "unavailable";
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = 0.82;
    utterance.pitch = voice ? 1.1 : 1.3;
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
    return "spoken";
  } catch { return "unavailable"; }
}

export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
