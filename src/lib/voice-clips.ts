import { voiceClipKeys } from "@/lib/voice-manifest";

/**
 * Recorded voices for everything the games say. Each sentence is recorded once per voice
 * (scripts/voice), so a line like "Great job dear! The ball is a circle!" plays as two clips.
 * A line with any sentence not recorded is read by the browser's own voice instead.
 */
export type VoiceGender = "female" | "male";
export const voiceGenders: readonly VoiceGender[] = ["female", "male"];
export function isVoiceGender(value: unknown): value is VoiceGender { return value === "female" || value === "male"; }

/** What the grown-up area plays to compare the voices. */
export const voicePreview = "Hello! Let's play and learn together!";

/** "Great job dear! Three stars!" → ["Great job dear!", "Three stars!"]. */
export function splitSentences(text: string): string[] {
  return text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
}

/** The recording's file name: the same for the same words, whatever the case or spacing. */
export function clipKey(sentence: string): string {
  let hash = 0x811c9dc5;
  for (const char of sentence.toLowerCase().replace(/\s+/g, " ").trim()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const recorded = new Set(voiceClipKeys.split(" ").filter(Boolean));

/** The clips for a whole line, in order, or null when any sentence has no recording. */
export function clipUrls(text: string, voice: VoiceGender, available: ReadonlySet<string> = recorded): string[] | null {
  const sentences = splitSentences(text);
  if (!sentences.length) return null;
  const keys = sentences.map(clipKey);
  const missing = sentences.filter((_, index) => !available.has(keys[index]));
  if (missing.length) {
    // Shown while developing, so new lines can be added to scripts/voice/phrases.mjs.
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") console.info(`[voice] not recorded yet: ${missing.map((sentence) => `"${sentence}"`).join(", ")}`);
    return null;
  }
  return keys.map((key) => `/voice/${voice}/${key}.mp3`);
}
