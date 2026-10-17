import type { AnimalId } from "@/lib/animal-data";

/*
 * Real animal sound recordings, keyed by animal id.
 *
 * No recordings ship with the app yet, so this map is intentionally empty and the
 * "Guess That Sound" game shows a friendly "coming soon" card instead of faking sounds.
 *
 * To add a sound:
 *   1. Use a recording you own or that is licensed for this use (for example CC0 / public domain),
 *      and keep a note of its source and licence in public/sounds/animals/CREDITS.md.
 *   2. Save it as public/sounds/animals/<animal-id>.mp3 (short clips, 1–4 seconds, work best).
 *   3. Add a line here, e.g.  lion: "/sounds/animals/lion.mp3",
 *
 * `npm run test:games` checks that every path listed here exists on disk.
 * The sound quiz turns on automatically once at least three animals have sounds.
 */
export const animalSoundFiles: Partial<Record<AnimalId, string>> = {};
