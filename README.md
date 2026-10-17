# Play & Learn

Play & Learn is a local-first preschool learning PWA for ages 3–6. It has two games, Alphabet Adventure and Animal Safari, alongside Home Missions and grown-up settings. The app has no account system, backend, analytics, advertising, payments, or personal-data collection.

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

- `src/app/` — App Router pages for home, the Games page (`/games`), Alphabet Adventure, Animal Safari, Home Missions, and grown-up settings. Games are listed in `src/lib/games.ts`; add a new game there and it appears on the home screen and Games page.
- `src/components/` — shared UI and layout, settings application, service-worker registration, and offline status.
- `src/features/games/` — shared game UI (top bar, mode cards, quiz card, feedback bear, stars, completion card) and the `useQuizSession` hook.
- `src/features/alphabet/` — three playable alphabet modes and session summary.
- `src/features/animal-safari/` — Meet the Animals gallery and detail view, Guess That Sound, and Find the Animal.
- `src/features/home/` — home screen, mascot, and mobile navigation.
- `src/lib/` — typed content (`alphabet-data.ts`, `animal-data.ts`), question datasets and generators (`alphabet-questions.ts`, `animal-questions.ts`), speech (`speech.ts`), the sound player (`sound-player.ts`), the animal sound manifest (`animal-sounds.ts`), per-game progress, missions, and settings.
- `tests/` — Node test runner checks for content, questions, progress, speech, and sound playback.
- `public/` — manifest, icons, service worker, and offline fallback.

## App layout and navigation

The shared app shell provides Home, Games, Missions, and Parent navigation on every route. Progress remains inside the existing parent area. Mobile navigation stays at the bottom with safe-area spacing; tablet and desktop navigation moves to the header at 768px. Game pages use `GameScreen` (`src/features/games/game-ui.tsx`), which fills the phone screen between the header and the bottom bar so play screens fit without scrolling; the bottom bar stays visible and never covers answers. Text input temporarily hides the mobile bar. Navigation inside games always goes one step up: Games page → a game's modes → a mode ("← Back"). Cache Components keeps visited pages mounted but hidden, so each game resets to its mode list when hidden, and full-screen pages mark themselves with `html[data-fill-screen]` instead of relying on `:has()`. Add future destinations and route prefixes in `src/components/layout/app-navigation.tsx`.

## PWA and offline behavior

The app uses a manual versioned service worker at `/sw.js`. It precaches the shell, manifest, icons, and offline fallback; visited home, game, and mission documents and Next static chunks are cached at runtime. `/grown-ups` is intentionally not cached.

Service-worker registration runs in production builds. Production must use HTTPS. Settings and progress are device-local only. An offline page must have been opened successfully online before its document and chunks are available offline. Alphabet Adventure uses browser speech synthesis when available and enabled in grown-up settings. Both games' emoji illustrations are local, platform-rendered placeholders for future original artwork.

## Animal sounds

No animal sound recordings ship with the app, so **Guess That Sound** shows a "coming soon" card and the Meet the Animals detail view hides its Sound button. Spoken animal names are never presented as animal sounds.

To add sounds:

1. Use recordings you own or that are licensed for this use (for example CC0 or public domain). Record each source and licence in `public/sounds/animals/CREDITS.md`.
2. Save short clips (1–4 seconds) as `public/sounds/animals/<animal-id>.mp3`. The animal ids are listed in `src/lib/animal-data.ts`.
3. List each file in `src/lib/animal-sounds.ts`, for example `lion: "/sounds/animals/lion.mp3",`.

`npm run test:games` fails if a listed file is missing. The sound quiz turns on automatically once at least three animals have sounds, and only those animals are used as sound questions.

## Deployment

This Next.js project can be deployed to a host that supports Next.js. Run `npm run build` before deployment and verify the home page, `/alphabet-adventure`, `/animal-safari`, `/missions`, `/grown-ups`, `/manifest.webmanifest`, and `/sw.js` over HTTPS.

## Manual checks

- [ ] Check the home page at narrow and wide widths. Its Alphabet Adventure and Home Missions links should work.
- [ ] Visit all 26 letters in Discover mode, including Previous, Next, replay, and finish.
- [ ] Play Find and Match, including wrong answers, correct answers, and session summaries.
- [ ] Reload and confirm alphabet progress persists; check sound on, sound off, and browsers without speech synthesis.
- [ ] In Animal Safari, open all 24 animals across the four habitats, replay names and facts, and finish Meet the Animals.
- [ ] Play Find the Animal, including wrong answers, Previous/Next, and the summary. Confirm Guess That Sound shows "coming soon" until sound files are added.
- [ ] Confirm removed routes `/letter-adventure` and `/color-quest` return 404.
- [ ] Complete a Home Mission, reload, and confirm its progress remains.
- [ ] Change grown-up settings, reload, and confirm they persist.
- [ ] Reset progress from the grown-up page and confirm mission, alphabet, and animal safari progress clear.
- [ ] Build and check the home and visited mission page offline in a production browser session.
