import { readSettings } from "@/lib/app-settings";
import { stopSpeech } from "@/lib/speech";

let current: HTMLAudioElement | null = null;

/** Plays one local sound file at a time; any earlier sound or speech is stopped first. */
export function playSound(src: string, onError?: () => void): "playing" | "muted" | "unavailable" {
  if (!readSettings().soundOn) return "muted";
  if (typeof window === "undefined" || typeof window.Audio !== "function") return "unavailable";
  stopSound();
  stopSpeech();
  try {
    const audio = new window.Audio(src);
    current = audio;
    audio.onerror = () => onError?.();
    audio.play()?.catch(() => onError?.());
    return "playing";
  } catch { return "unavailable"; }
}

export function stopSound(): void {
  if (!current) return;
  const audio = current;
  current = null;
  audio.onerror = null;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}
