import { readSettings } from "@/lib/app-settings";
import { stopSpeech, type AudioErrorHandler } from "@/lib/speech";

// One shared <audio> element. iOS only lets an element play without a tap once it has played
// during a tap, so the element is "unlocked" with a silent clip on the first touch anywhere.
let player: HTMLAudioElement | null = null;
let playId = 0;
/** What the shared element is playing, so stopping speech never cuts off an animal sound. */
let playing: "sound" | "voice" | null = null;

function getPlayer(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio !== "function") return null;
  player ??= new window.Audio();
  return player;
}

/** A 0.05 s silent WAV, built in code to avoid shipping a file. */
function silentWav(): string {
  const samples = 400;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  text(0, "RIFF"); view.setUint32(4, 36 + samples, true); text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, "data"); view.setUint32(40, samples, true); bytes.fill(128, 44);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

// Browsers treat touchend and click (not pointerdown) as the tap that allows audio.
if (typeof document !== "undefined") {
  const unlock = () => {
    const audio = getPlayer();
    if (!audio || audio.src) return;
    audio.src = silentWav();
    audio.play()?.catch(() => undefined);
  };
  for (const type of ["touchend", "click"]) document.addEventListener(type, unlock, { once: true, capture: true });
}

/** Plays one local sound file at a time; any earlier sound or speech is stopped first. */
export function playSound(src: string, onError?: AudioErrorHandler): "playing" | "muted" | "unsupported" | "unavailable" {
  if (!readSettings().soundOn) return "muted";
  const audio = getPlayer();
  if (!audio) return "unsupported";
  stopSound();
  stopSpeech();
  const id = ++playId;
  // Only failures of the sound that is still current count; a sound we stopped on purpose is not an error.
  const fail = (reason: string) => {
    if (id !== playId || reason === "AbortError") return;
    onError?.(reason);
  };
  try {
    playing = "sound";
    audio.onended = () => { if (id === playId) playing = null; };
    audio.onerror = () => fail(`media-error-${audio.error?.code ?? "unknown"}`);
    audio.src = src;
    audio.play()?.catch((error: { name?: string } | undefined) => fail(error?.name ?? "play-failed"));
    return "playing";
  } catch { return "unavailable"; }
}

/**
 * Plays recorded speech clips one after another on the shared element (speech that starts last wins,
 * so any sound stops). `onFail` gets the reason and how many clips had started, so the caller can
 * read the rest another way.
 */
export function playVoiceClips(srcs: readonly string[], onFail: (reason: string, started: number) => void): "playing" | "unsupported" {
  const audio = getPlayer();
  if (!audio || !srcs.length) return "unsupported";
  stopSound();
  const id = ++playId;
  let next = 0;
  const fail = (reason: string) => {
    if (id !== playId || reason === "AbortError") return;
    playing = null;
    onFail(reason, next);
  };
  const playNext = () => {
    if (id !== playId) return;
    if (next >= srcs.length) { playing = null; return; }
    audio.src = srcs[next++];
    audio.play()?.catch((error: { name?: string } | undefined) => fail(error?.name ?? "play-failed"));
  };
  playing = "voice";
  audio.onended = playNext;
  audio.onerror = () => fail(`media-error-${audio.error?.code ?? "unknown"}`);
  try { playNext(); } catch { fail("play-failed"); }
  return "playing";
}

/** Stops recorded speech, leaving an animal sound playing. */
export function stopVoiceClips(): void {
  if (playing === "voice") stopSound();
}

export function stopSound(): void {
  playId++;
  playing = null;
  player?.pause();
}
