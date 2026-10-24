# Recorded voices

The games read everything aloud with two recorded voices, chosen in the parent area
(Settings → Reading voice): **female** (Kokoro `af_heart`) and **male** (Kokoro `am_michael`).
[Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) is a free, Apache-2.0 voice model that runs on
your own computer: no account, API key, or payment. The app only ships the MP3s.

Each sentence is one file, `public/voice/<voice>/<key>.mp3`, where `<key>` is a hash of the
sentence (`clipKey` in `src/lib/voice-clips.ts`). `src/lib/voice-manifest.ts` lists the sentences
recorded in both voices. A line with any sentence that isn't recorded is read by the browser's own
voice instead, so a missing recording never breaks a game.

## After changing what a game says

1. Add the new lines to `phrases.mjs` (most come straight from the games' data already).
2. Record them, in this folder:

   ```
   npm install
   npm run generate
   ```

   Only missing sentences are recorded; recordings for lines the games no longer say are removed.
   The first run downloads the model (about 90 MB). Use `npm run generate -- --redo` to record
   everything again, for example after changing a voice or the speed in `generate.mjs`.

While developing, the browser console shows `[voice] not recorded yet: ...` for any line that
falls back to the browser voice.
