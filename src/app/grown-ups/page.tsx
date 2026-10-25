"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Crown, isPremiumUser, UserAvatar } from "@/components/ui/user-avatar";
import { AccountPanel, PARENT_RETURN_KEY, type AccountNotice, type AccountState } from "@/features/parent/account-panel";
import { GameProgressCard, ProgressOverview } from "@/features/parent/progress-dashboard";
import { ACTIVITY_STORAGE_KEY, readLastPlayed, type LastPlayed } from "@/lib/activity";
import { ANIMAL_PROGRESS_KEY, emptyAnimalProgress, readAnimalProgress, type AnimalProgress } from "@/lib/animal-progress";
import { animalSoundCredits } from "@/lib/animal-sounds";
import { AuthError, getCurrentUser, getPlan, getProviders, googleErrorMessage, type AuthProviders, type AuthUser, type PublicPlan } from "@/lib/auth-client";
import { refreshPremium } from "@/lib/premium";
import { COLOR_PROGRESS_KEY, emptyColorProgress, readColorProgress, type ColorProgress } from "@/lib/color-progress";
import { ALPHABET_PROGRESS_KEY, emptyAlphabetProgress, readAlphabetProgress, type AlphabetProgress } from "@/lib/alphabet-progress";
import { COUNT_PROGRESS_KEY, emptyCountProgress, readCountProgress, type CountProgress } from "@/lib/count-progress";
import { emptyShapeProgress, readShapeProgress, SHAPE_PROGRESS_KEY, type ShapeProgress } from "@/lib/shape-progress";
import { emptyMemoryProgress, MEMORY_PROGRESS_KEY, readMemoryProgress, type MemoryProgress } from "@/lib/memory-progress";
import { DEFAULT_SETTINGS, MISSIONS_STORAGE_KEY, type AgeRange, type AppSettings, type ReminderInterval, readCompletedMissions, readSettings, saveSettings } from "@/lib/app-settings";
import { homeMissions } from "@/lib/missions";
import { MISSION_DAYS_KEY } from "@/lib/mission-journey";
import { speak } from "@/lib/speech";
import { voicePreview, type VoiceGender } from "@/lib/voice-clips";
import { buildParentReport } from "@/lib/parent-report";

type GateQuestion = { first: number; second: number; answer: number };
function makeGateQuestion(): GateQuestion { const first = Math.floor(Math.random() * 5) + 3; const second = Math.floor(Math.random() * 4) + 2; return { first, second, answer: first + second }; }

const voiceOptions: readonly { id: VoiceGender; label: string; emoji: string }[] = [{ id: "female", label: "Female voice", emoji: "👩" }, { id: "male", label: "Male voice", emoji: "👨" }];

type Tab = "progress" | "account" | "settings";
const tabs: readonly { id: Tab; label: string }[] = [{ id: "progress", label: "Progress" }, { id: "account", label: "Account" }, { id: "settings", label: "Settings" }];

const paymentMessages: Record<string, AccountNotice> = {
  success: { tone: "success", message: "Payment received. Premium is unlocked. Thank you!" },
  pending: { tone: "success", message: "We're still confirming your payment with the bank. This usually takes a minute; Premium unlocks as soon as it's confirmed." },
  failed: { tone: "error", message: "The payment didn't go through, so nothing was added. You can try again." },
};

/** Reads and clears the result the API adds to the URL after Google sign-in or a payment. */
function takeReturnResult(): AccountNotice | null {
  const url = new URL(window.location.href);
  const google = url.searchParams.get("auth") === "google";
  const googleError = url.searchParams.get("auth_error");
  const payment = url.searchParams.get("payment");
  if (!google && !googleError && !payment) return null;
  for (const key of ["auth", "auth_error", "payment"]) url.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  if (payment) return paymentMessages[payment] ?? paymentMessages.failed;
  return googleError ? { tone: "error", message: googleErrorMessage(googleError) } : { tone: "success", message: "You're signed in with Google." };
}

export default function GrownUpsPage() {
  const [question, setQuestion] = useState<GateQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [gateError, setGateError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("progress");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [alphabetProgress, setAlphabetProgress] = useState<AlphabetProgress>(emptyAlphabetProgress);
  const [animalProgress, setAnimalProgress] = useState<AnimalProgress>(emptyAnimalProgress);
  const [colorProgress, setColorProgress] = useState<ColorProgress>(emptyColorProgress);
  const [countProgress, setCountProgress] = useState<CountProgress>(emptyCountProgress);
  const [shapeProgress, setShapeProgress] = useState<ShapeProgress>(emptyShapeProgress);
  const [memoryProgress, setMemoryProgress] = useState<MemoryProgress>(emptyMemoryProgress);
  const [lastPlayed, setLastPlayed] = useState<LastPlayed>({});
  const [now, setNow] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [account, setAccount] = useState<AccountState>({ status: "loading" });
  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [notice, setNotice] = useState<AccountNotice | null>(null);

  const loadAccount = useCallback(async () => {
    setAccount({ status: "loading" });
    try {
      const [user, available, premiumPlan] = await Promise.all([getCurrentUser(), getProviders(), getPlan()]);
      setProviders(available);
      setPlan(premiumPlan);
      setAccount(user ? { status: "signed-in", user } : { status: "signed-out" });
      // Keep the games' Premium locks in step with what the account shows.
      void refreshPremium();
    } catch (error) {
      setAccount({ status: "error", message: error instanceof AuthError ? error.message : "Couldn't load your account." });
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { setQuestion(makeGateQuestion()); setSettings(readSettings()); setCompletedMissions(readCompletedMissions()); setAlphabetProgress(readAlphabetProgress()); setAnimalProgress(readAnimalProgress()); setColorProgress(readColorProgress()); setCountProgress(readCountProgress()); setShapeProgress(readShapeProgress()); setMemoryProgress(readMemoryProgress()); setLastPlayed(readLastPlayed()); setNow(Date.now());
    // Coming back from Google: the adult check was already passed before leaving.
    let returning = false;
    try { returning = window.sessionStorage.getItem(PARENT_RETURN_KEY) === "account"; window.sessionStorage.removeItem(PARENT_RETURN_KEY); } catch { /* Ask the adult check again. */ }
    const returnResult = takeReturnResult();
    if (returnResult) { setNotice(returnResult); setTab("account"); }
    if (returning && returnResult) setUnlocked(true);
  }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!unlocked) return; const timer = window.setTimeout(() => void loadAccount(), 0); return () => window.clearTimeout(timer); }, [unlocked, loadAccount]);
  useEffect(() => { if (!unlocked) return; document.documentElement.dataset.theme = settings.warmTheme ? "warm" : "soft"; document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false"; }, [settings, unlocked]);

  const report = useMemo(() => buildParentReport({ alphabet: alphabetProgress, animal: animalProgress, color: colorProgress, count: countProgress, shape: shapeProgress, memory: memoryProgress, lastPlayed }), [alphabetProgress, animalProgress, colorProgress, countProgress, shapeProgress, memoryProgress, lastPlayed]);
  const missionsDone = homeMissions.filter((mission) => completedMissions.includes(mission.id)).length;

  function unlock(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!question || Number(answer) !== question.answer) { setGateError("That answer needs another try. Ask a grown-up to solve it together."); setAnswer(""); setQuestion(makeGateQuestion()); return; } setUnlocked(true); setGateError(""); }
  function signedIn(user: AuthUser) { setAccount({ status: "signed-in", user }); setNotice({ tone: "success", message: `Welcome, ${user.name}!` }); void refreshPremium(); }
  function signedOut(message = "You're signed out.") { setAccount({ status: "signed-out" }); setNotice({ tone: "success", message }); void refreshPremium(); }
  function updateSettings(next: AppSettings) { setSettings(next); saveSettings(next); }
  /** Saves the voice first, so the sample is read in the voice just picked. */
  function chooseVoice(voice: VoiceGender) { updateSettings({ ...settings, voice }); speak(voicePreview); }
  function resetProgress() { window.localStorage.removeItem("play-learn-progress-v1"); window.localStorage.removeItem(ALPHABET_PROGRESS_KEY); window.localStorage.removeItem(ANIMAL_PROGRESS_KEY); window.localStorage.removeItem(COLOR_PROGRESS_KEY); window.localStorage.removeItem(COUNT_PROGRESS_KEY); window.localStorage.removeItem(SHAPE_PROGRESS_KEY); window.localStorage.removeItem(MEMORY_PROGRESS_KEY); window.localStorage.removeItem(MISSIONS_STORAGE_KEY); window.localStorage.removeItem(MISSION_DAYS_KEY); window.localStorage.removeItem(ACTIVITY_STORAGE_KEY); setCompletedMissions([]); window.location.reload(); }

  if (!unlocked) return <main className="min-h-[calc(100vh-4.5rem)] bg-cream py-12 sm:py-20"><div className="page-container mx-auto max-w-md"><Link href="/" className="text-sm font-black text-ink underline underline-offset-4">← Back home</Link><Card className="mt-8 bg-white p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-muted-ink">Grown-up check</p><h1 className="mt-3 text-3xl font-black text-ink">A quick question before the parent area</h1><p className="mt-3 leading-7 text-muted-ink">This small arithmetic check helps keep progress and settings away from little hands. Please ask an adult to answer.</p>{question ? <form onSubmit={unlock} className="mt-7"><label htmlFor="gate-answer" className="block text-xl font-black text-ink">What is {question.first} + {question.second}?</label><input id="gate-answer" inputMode="numeric" pattern="[0-9]*" value={answer} onChange={(event) => setAnswer(event.target.value)} autoComplete="off" className="mt-4 min-h-14 w-full rounded-2xl border-2 border-sky bg-cream px-4 text-2xl font-black text-ink outline-none focus:border-ink" /><Button type="submit" className="mt-4 w-full">Open parent area</Button>{gateError ? <p role="alert" className="mt-3 rounded-2xl bg-coral/40 px-4 py-3 text-sm font-black text-ink">{gateError}</p> : null}</form> : <p className="mt-7 rounded-2xl bg-sky px-4 py-3 text-sm font-black text-ink">Getting the grown-up question ready…</p>}</Card></div></main>;

  return <main className="min-h-[calc(100vh-4.5rem)] bg-cream pb-16 pt-8 sm:pt-12"><div className="page-container mx-auto max-w-4xl">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/" className="text-sm font-black text-ink underline underline-offset-4">← Back home</Link><p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-muted-ink">Grown-up space</p><h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-5xl">Parent dashboard</h1></div><button type="button" onClick={() => setTab("account")} className={`inline-flex max-w-full items-center gap-2 self-start rounded-full py-1.5 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:self-auto ${account.status === "signed-in" ? `pl-1.5 pr-4 ${isPremiumUser(account.user) ? "premium-pill" : "bg-mint"}` : "bg-mint px-4"}`}>{account.status === "signed-in" ? <><UserAvatar user={account.user} size="sm" /><span className="truncate">{account.user.name}</span>{isPremiumUser(account.user) ? <span className="inline-flex shrink-0 items-center gap-1 text-xs uppercase tracking-[0.12em] text-[#6b3a00]"><Crown className="w-3.5" />Premium</span> : null}</> : account.status === "loading" ? "Checking account…" : "Not signed in · Sign in"}</button></div>

    <div role="tablist" aria-label="Parent area sections" className="mt-8 grid grid-cols-3 gap-2 rounded-full bg-white p-1.5 shadow-[0_4px_0_rgba(42,91,145,0.15)] sm:inline-grid">{tabs.map((item) => <button key={item.id} type="button" role="tab" id={`tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} onClick={() => setTab(item.id)} className={`min-h-11 rounded-full px-4 text-sm font-black transition sm:px-6 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${tab === item.id ? "bg-ink text-white" : "text-ink hover:bg-cream"}`}>{item.label}</button>)}</div>

    {tab === "progress" ? <section role="tabpanel" id="panel-progress" aria-labelledby="tab-progress" className="mt-6 grid gap-6">
      <ProgressOverview report={report} missionsDone={missionsDone} missionsTotal={homeMissions.length} now={now} />
      <h2 className="mt-2 text-2xl font-black text-ink">Progress by game</h2>
      {report.games.map((game) => <GameProgressCard key={game.id} report={game} now={now} />)}
    </section> : tab === "account" ? <section role="tabpanel" id="panel-account" aria-labelledby="tab-account" className="mt-6">
      <AccountPanel account={account} providers={providers} plan={plan} notice={notice} onSignedIn={signedIn} onSignedOut={signedOut} onRetry={() => void loadAccount()} />
    </section> : <section role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" className="mt-6">
      <Card className="bg-white p-6 sm:p-8"><h2 className="text-2xl font-black text-ink">Child profile</h2><fieldset className="mt-5"><legend className="text-sm font-black text-ink">Age range</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{(["3-4", "5-6"] as AgeRange[]).map((age) => <label key={age} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-black ${settings.ageRange === age ? "border-ink bg-sky" : "border-sky bg-white"}`}><input type="radio" name="age-range" checked={settings.ageRange === age} onChange={() => updateSettings({ ...settings, ageRange: age })} />{age} years</label>)}</div></fieldset></Card>
      <Card className="mt-6 bg-white p-6 sm:p-8"><h2 className="text-2xl font-black text-ink">Play preferences</h2><div className="mt-5 grid gap-3"><label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-cream px-4 font-black text-ink"><span>Sound effects and spoken words</span><input type="checkbox" checked={settings.soundOn} onChange={(event) => updateSettings({ ...settings, soundOn: event.target.checked })} className="size-5 accent-[#30465D]" /></label><div className="rounded-2xl bg-cream px-4 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p id="voice-label" className="font-black text-ink">Reading voice</p><button type="button" onClick={() => speak(voicePreview)} disabled={!settings.soundOn} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-white px-4 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"><span aria-hidden="true">🔊</span> Hear it</button></div><p className="mt-1 text-sm leading-6 text-muted-ink">The voice that reads questions, names, and cheers to your child.</p><div role="radiogroup" aria-labelledby="voice-label" className="mt-3 grid gap-3 sm:grid-cols-2">{voiceOptions.map((option) => <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-black text-ink ${settings.voice === option.id ? "border-ink bg-sky" : "border-sky bg-white"}`}><input type="radio" name="reading-voice" checked={settings.voice === option.id} onChange={() => chooseVoice(option.id)} /><span aria-hidden="true">{option.emoji}</span>{option.label}</label>)}</div>{settings.soundOn ? null : <p className="mt-2 text-sm font-bold text-muted-ink">Turn on spoken words above to hear the voice.</p>}</div><label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-cream px-4 font-black text-ink"><span>Reduce movement</span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ ...settings, reducedMotion: event.target.checked })} className="size-5 accent-[#30465D]" /></label><label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl bg-cream px-4 font-black text-ink"><span>Warm color theme</span><input type="checkbox" checked={settings.warmTheme} onChange={(event) => updateSettings({ ...settings, warmTheme: event.target.checked })} className="size-5 accent-[#30465D]" /></label><label className="flex flex-col items-start gap-2 rounded-2xl bg-cream px-4 py-4 font-black text-ink sm:flex-row sm:items-center sm:justify-between"><span>Session reminder interval</span><select value={settings.reminderInterval} onChange={(event) => updateSettings({ ...settings, reminderInterval: Number(event.target.value) as ReminderInterval })} className="min-h-11 rounded-xl border-2 border-white bg-white px-3 text-sm font-black outline-none focus:border-ink"><option value={0}>Off</option><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={45}>Every 45 minutes</option><option value={60}>Every 60 minutes</option></select></label></div><p className="mt-5 rounded-2xl bg-sky px-4 py-3 text-sm leading-6 text-muted-ink">Reminders are simple in-app preferences only. They are not medical protection and cannot guarantee eye comfort or safe screen time.</p></Card>
      <Card className="mt-6 border-coral/40 bg-coral/20 p-6 sm:p-8"><h2 className="text-2xl font-black text-ink">Reset local learning progress</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-ink">Remove saved mission, Alphabet Adventure, Animal Safari, Color Quest, Count the Stars, Shape Safari, and Memory Match progress from this device. Settings will stay in place.</p><Button variant="secondary" onClick={() => setResetOpen(true)} className="mt-5">Reset progress</Button></Card>
      <Card className="mt-6 bg-white p-6 sm:p-8"><details><summary className="cursor-pointer text-lg font-black text-ink">Animal sound credits</summary><p className="mt-3 text-sm leading-6 text-muted-ink">Animal Safari uses real recordings from Wikimedia Commons, trimmed and converted for the app. CC BY-SA clips are shared under the same licence.</p><ul className="mt-3 grid gap-2 text-sm leading-6 text-ink">{Object.entries(animalSoundCredits).map(([id, credit]) => credit ? <li key={id}><span className="font-black capitalize">{id}:</span> <a href={credit.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{credit.source}</a> by {credit.author} ({credit.license})</li> : null)}</ul></details></Card>
    </section>}

    <p className="mt-8 text-center text-sm leading-6 text-muted-ink">Children can play without an account, and their progress stays on this device. See our <Link href="/privacy" className="font-black text-ink underline underline-offset-4">Privacy Policy</Link>, <Link href="/terms" className="font-black text-ink underline underline-offset-4">Terms</Link>, <Link href="/refund-policy" className="font-black text-ink underline underline-offset-4">Refund Policy</Link> and <Link href="/about" className="font-black text-ink underline underline-offset-4">Features &amp; Pricing</Link>, or <Link href="/contact" className="font-black text-ink underline underline-offset-4">contact us</Link>. A browser cannot reliably lock the whole phone, control system brightness, or guarantee eye protection.</p>
  </div><ConfirmDialog open={resetOpen} title="Reset local progress?" description="This will remove saved Home Mission, Alphabet Adventure, Animal Safari, Color Quest, Count the Stars, Shape Safari, and Memory Match progress from this device. Your settings will stay safe, but this cannot be undone." confirmLabel="Reset progress" onCancel={() => setResetOpen(false)} onConfirm={resetProgress} /></main>;
}
