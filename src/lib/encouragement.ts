export const cheerPhrases = ["Great job dear! 🌟", "Wonderful! You got it! 🎉", "Yay! Well done dear! ⭐", "Super star! That's right! 🌟", "Amazing work dear! 🎈"];
export const retryPhrases = ["No problem dear. Try again! 💛", "Good try! Let's try once more. 🙂", "Almost dear! You can do it! 💪", "That's okay dear. Try again! 🌈"];
export const alreadyFoundPhrase = "You found this one already dear! 🌟";

export function pickPhrase(phrases: readonly string[], random: () => number = Math.random): string {
  return phrases[Math.floor(random() * phrases.length)];
}

// Emoji are for the screen only; speech engines would read them out by name.
// Phrases avoid a comma before "dear" so the voice says it smoothly without a pause.
export function speakableText(message: string): string {
  return message.replace(/[^\p{L}\p{N}\s,.!?']/gu, "").trim();
}
