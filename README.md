# Play & Learn

Play & Learn is a local-first preschool learning PWA for ages 3–6. It has three games, Alphabet Adventure, Animal Safari, and Color Quest, alongside Home Missions and grown-up settings. The app has no account system, backend, analytics, advertising, payments, or personal-data collection.

## Install and develop

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production checks and server:

```bash
npm run lint
npm run test:games
npm run build
npm run start -- -p 3010
```

## Architecture

- `src/app/` — App Router pages for home, the Games page (`/games`), Alphabet Adventure, Animal Safari, Color Quest, Home Missions, and grown-up settings. Games are listed in `src/lib/games.ts`; add a new game there and it appears on the home screen and Games page.
- `src/components/` — shared UI and layout, settings application, service-worker registration, and offline status.
- `src/features/games/` — shared game UI (top bar, mode cards, quiz card, feedback bear, stars, completion card) and the `useQuizSession` hook.
- `src/features/alphabet/` — three playable alphabet modes and session summary.
- `src/features/animal-safari/` — Meet the Animals gallery and detail view, Guess That Sound, and Find the Animal.
- `src/features/color-quest/` — Meet the Colors, Find the Color (SVG objects drawn in exact colors), Color the World (tap-to-fill SVG pictures with undo and start over), and Color Detective (grown-up-assisted home missions).
- `src/features/home/` — home screen, mascot, and mobile navigation.
- `src/lib/` — typed content (`alphabet-data.ts`, `animal-data.ts`, `color-data.ts`, `coloring-pictures.ts`), question datasets and generators (`alphabet-questions.ts`, `animal-questions.ts`, `color-questions.ts`), coloring logic (`coloring.ts`), speech (`speech.ts`), the sound player (`sound-player.ts`), the animal sound manifest (`animal-sounds.ts`), per-game progress, missions, and settings.
- `tests/` — Node test runner checks for content, questions, progress, speech, and sound playback.
- `public/` — manifest, icons, service worker, and offline fallback.

## App layout and navigation

The shared app shell provides Home, Games, Missions, and Parent navigation on every route. Progress remains inside the existing parent area. Mobile navigation stays at the bottom with safe-area spacing; tablet and desktop navigation moves to the header at 768px. Game pages use `GameScreen` (`src/features/games/game-ui.tsx`), which fills the phone screen between the header and the bottom bar so play screens fit without scrolling; the bottom bar stays visible and never covers answers. Text input temporarily hides the mobile bar. Navigation inside games always goes one step up: Games page → a game's modes → a mode ("← Back"). Cache Components keeps visited pages mounted but hidden, so each game resets to its mode list when hidden, and full-screen pages mark themselves with `html[data-fill-screen]` instead of relying on `:has()`. Add future destinations and route prefixes in `src/components/layout/app-navigation.tsx`.

## PWA and offline behavior

The app uses a manual versioned service worker at `/sw.js`. It precaches the shell, manifest, icons, and offline fallback; visited home, game, and mission documents and Next static chunks are cached at runtime. `/grown-ups` is intentionally not cached.

Service-worker registration runs in production builds. Production must use HTTPS. Settings and progress are device-local only. An offline page must have been opened successfully online before its document and chunks are available offline. Alphabet Adventure uses browser speech synthesis when available and enabled in grown-up settings. The games' emoji illustrations are local, platform-rendered placeholders for future original artwork. Color Quest's quiz objects and coloring pictures are original inline SVG, so their colors are exact; its progress is stored under `play-learn-color-quest-v1`.

## Animal sounds

Guess That Sound and the Meet the Animals "Sound" button use 14 real recordings in `public/sounds/animals/`: cow, sheep, pig, chicken, duck, horse, lion, elephant, owl, frog, monkey, dolphin, whale, and bear. All come from Wikimedia Commons and are public domain, CC0, CC BY, or CC BY-SA. Each was trimmed to its first few seconds of sound, loudness-normalised, and saved as a mono 64 kbps MP3 (about 360 KB in total). Sources, authors, and licences are listed in `src/lib/animal-sounds.ts` and shown under "Animal sound credits" on the grown-ups page, as the CC BY licences require. Spoken animal names are never presented as animal sounds; animals without a recording (for example giraffe or butterfly) are left out of the sound quiz.

To add or replace a sound:

1. Use a recording you own or that is licensed for this use (public domain, CC0, CC BY, or CC BY-SA).
2. Save a short clip (1–4 seconds, one clear sound) as `public/sounds/animals/<animal-id>.mp3`. Animal ids are listed in `src/lib/animal-data.ts`.
3. Add an entry with its source, author, licence, and link to `animalSoundCredits` in `src/lib/animal-sounds.ts`.

`npm run test:games` fails if a listed file is missing. The sound quiz needs at least three animals with sounds. The service worker caches sounds after they are first played.

## Deployment

This Next.js project can be deployed to a host that supports Next.js. Run `npm run build` before deployment and verify the home page, `/alphabet-adventure`, `/animal-safari`, `/color-quest`, `/missions`, `/grown-ups`, `/manifest.webmanifest`, and `/sw.js` over HTTPS.

## Manual checks

- [ ] Check the home page at narrow and wide widths. Its Alphabet Adventure and Home Missions links should work.
- [ ] Visit all 26 letters in Discover mode, including Previous, Next, replay, and finish.
- [ ] Play Find and Match, including wrong answers, correct answers, and session summaries.
- [ ] Reload and confirm alphabet progress persists; check sound on, sound off, and browsers without speech synthesis.
- [ ] In Animal Safari, open all 24 animals across the four habitats, replay names and facts, and finish Meet the Animals.
- [ ] Play Find the Animal, including wrong answers, Previous/Next, and the summary. Play Guess That Sound and confirm each sound matches the correct animal.
- [ ] In Color Quest, open all 10 colors in Meet the Colors; play Find the Color with wrong answers, repeated taps, Previous/Next, and the summary; fully color each of the 5 pictures with Undo and Start over by touch, mouse, and keyboard (Tab to a part, Enter to paint); mark and unmark Color Detective missions.
- [ ] Confirm the removed route `/letter-adventure` returns 404.
- [ ] Complete a Home Mission, reload, and confirm its progress remains.
- [ ] Change grown-up settings, reload, and confirm they persist.
- [ ] Reset progress from the grown-up page and confirm mission, alphabet, animal safari, and color quest progress clear.
- [ ] Build and check the home and visited mission page offline in a production browser session.
