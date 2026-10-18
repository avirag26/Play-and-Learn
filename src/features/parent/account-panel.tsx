"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Padlock } from "@/components/ui/padlock";
import { isPremiumUser, PremiumChip, UserAvatar } from "@/components/ui/user-avatar";
import { AuthError, formatPrice, googleSignInUrl, login, logout, register, resendSignUpCode, startCheckout, verifySignUp, type AuthProviders, type AuthUser, type CodeSent, type PublicPlan } from "@/lib/auth-client";
import { games } from "@/lib/games";
import { hasAcceptedPrivacy, rememberPrivacyAccepted } from "@/lib/privacy";

export type AccountState = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: AuthUser } | { status: "error"; message: string };
export type AccountNotice = { tone: "success" | "error"; message: string };

/** sessionStorage flag: the grown-up passed the adult check before leaving for Google or a payment page, so skip it once on return. */
export const PARENT_RETURN_KEY = "play-learn-parent-return";

const longDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const durationText = (days: number) => days % 365 === 0 ? `${days / 365} year${days === 365 ? "" : "s"}` : days % 30 === 0 ? `${days / 30} month${days === 30 ? "" : "s"}` : `${days} days`;

function PremiumGames({ plan }: { plan: PublicPlan }) {
  const premium = games.filter((game) => plan.premiumGameIds.includes(game.id));
  if (!premium.length) return null;
  return <ul className="mt-3 flex flex-wrap gap-2">{premium.map((game) => <li key={game.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ink"><span aria-hidden="true">{game.emoji}</span>{game.title}</li>)}</ul>;
}

/** Premium status, and the button that sends the parent to the payment page. */
function PremiumCard({ user, plan }: { user: AuthUser; plan: PublicPlan | null }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = user.subscription.status;
  const until = user.subscription.currentPeriodEnd;

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = await startCheckout(plan?.requiresPhone ? phone : undefined);
      try { window.sessionStorage.setItem(PARENT_RETURN_KEY, "account"); } catch { /* The adult check will simply be asked again. */ }
      window.location.assign(url);
    } catch (caught) {
      setError(errorText(caught));
      setBusy(false);
    }
  }

  return <Card className="bg-white p-6 sm:p-8">
    <h2 className="text-2xl font-black text-ink">Premium</h2>
    {status === "active" && until ? <div className="mt-4 rounded-2xl bg-mint p-4"><p className="flex items-center gap-2 text-xl font-black text-ink"><Padlock locked={false} className="size-7 shrink-0 text-sm" />Premium is active</p><p className="mt-1 text-sm leading-6 text-muted-ink">Unlocked until <span className="font-black text-ink">{longDate(until)}</span>. Thank you for supporting Play &amp; Learn!</p></div>
      : status === "expired" && until ? <div className="mt-4 rounded-2xl bg-sunshine/50 p-4"><p className="text-xl font-black text-ink">Premium has ended</p><p className="mt-1 text-sm leading-6 text-muted-ink">It ended on {longDate(until)}. Buy again to unlock the Premium games.</p></div>
      : null}
    {!plan ? <p className="mt-4 text-sm text-muted-ink">Loading the Premium plan…</p>
      : <div className="mt-4 rounded-2xl bg-sky p-4">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-ink">{plan.name}</p>
        <p className="mt-1 text-3xl font-black text-ink">{formatPrice(plan.amount, plan.currency)} <span className="text-base font-bold text-muted-ink">for {durationText(plan.durationDays)}</span></p>
        <p className="mt-1 text-sm leading-6 text-muted-ink">One payment, no automatic renewal.{status === "active" ? " Buying again adds the time on top of what's left." : ""}</p>
        <PremiumGames plan={plan} />
      </div>}
    {plan && !plan.available ? <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-muted-ink">Premium isn&apos;t on sale right now. Please check back soon.</p>
      : plan ? <form onSubmit={buy} className="mt-5 grid gap-4">
        {plan.requiresPhone ? <label className="block text-sm font-black text-ink">Mobile number <span className="font-bold text-muted-ink">(needed by the payment provider)</span><input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="98765 43210" className={inputClass} /></label> : null}
        {error ? <p role="alert" className="rounded-2xl bg-coral/40 px-4 py-3 text-sm font-black text-ink">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full disabled:opacity-60">{busy ? "Opening secure payment…" : status === "active" ? `Add ${durationText(plan.durationDays)} · ${formatPrice(plan.amount, plan.currency)}` : `Get Premium · ${formatPrice(plan.amount, plan.currency)}`}</Button>
        <p className="text-center text-xs leading-5 text-muted-ink">You&apos;ll pay on our payment partner&apos;s secure page, then come straight back here.</p>
      </form> : null}
  </Card>;
}

const inputClass = "mt-2 min-h-12 w-full rounded-2xl border-2 border-sky bg-cream px-4 text-base font-bold text-ink outline-none focus:border-ink";

function GoogleLogo() {
  return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" /><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" /></svg>;
}

function Notice({ notice }: { notice: AccountNotice }) {
  return <p role={notice.tone === "error" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-sm font-black text-ink ${notice.tone === "error" ? "bg-coral/40" : "bg-mint"}`}>{notice.message}</p>;
}

const errorText = (caught: unknown) => caught instanceof AuthError ? caught.message : "Something went wrong. Please try again.";

/** Sign-up step 2: the 6-digit code from the email. */
function VerifyCodeStep({ sent, onBack, onSignedIn }: { sent: CodeSent; onBack: () => void; onSignedIn: (user: AuthUser) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const start = window.setTimeout(() => { setNow(Date.now()); setResendAt(Date.now() + sent.resendIn * 1000); }, 0);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearTimeout(start); window.clearInterval(tick); };
  }, [sent]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try { onSignedIn(await verifySignUp(sent.email, code)); }
    catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const next = await resendSignUpCode(sent.email);
      setResendAt(Date.now() + next.resendIn * 1000);
      setCode("");
      setInfo("We sent a new code. The old one no longer works.");
    } catch (caught) { setError(errorText(caught)); }
    finally { setBusy(false); }
  }

  return <Card className="bg-white p-6 sm:p-8">
    <h2 className="text-2xl font-black text-ink">Check your email</h2>
    <p className="mt-2 text-sm leading-6 text-muted-ink">We sent a 6-digit code to <span className="break-all font-black text-ink">{sent.email}</span>. It expires in {Math.round(sent.expiresIn / 60)} minutes.</p>
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label className="block text-sm font-black text-ink">Code from the email
        <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} placeholder="000000" autoFocus className={`${inputClass} text-center font-mono text-3xl tracking-[0.5em] placeholder:text-ink/20`} />
      </label>
      {error ? <p role="alert" className="rounded-2xl bg-coral/40 px-4 py-3 text-sm font-black text-ink">{error}</p> : null}
      {info ? <p role="status" className="rounded-2xl bg-mint px-4 py-3 text-sm font-black text-ink">{info}</p> : null}
      <Button type="submit" disabled={busy || code.length !== 6} className="w-full disabled:opacity-60">{busy ? "Please wait…" : "Verify and create account"}</Button>
    </form>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
      <button type="button" onClick={resend} disabled={busy || wait > 0} className="min-h-11 rounded-full px-3 font-black text-ink underline underline-offset-4 disabled:no-underline disabled:opacity-60">{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button>
      <button type="button" onClick={onBack} className="min-h-11 rounded-full px-3 font-black text-ink underline underline-offset-4">Use a different email</button>
    </div>
    <p className="mt-3 text-xs leading-5 text-muted-ink">Can&apos;t find it? Check your spam or promotions folder.</p>
  </Card>;
}

function SignInForm({ providers, onSignedIn }: { providers: AuthProviders | null; onSignedIn: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState<CodeSent | null>(null);
  const [agreed, setAgreed] = useState(false);
  // Only flagged once the parent has typed something to compare.
  const mismatch = mode === "register" && confirmPassword.length > 0 && confirmPassword !== password;

  useEffect(() => { const timer = window.setTimeout(() => setAgreed(hasAcceptedPrivacy()), 0); return () => window.clearTimeout(timer); }, []);

  /** Signing in or signing up both need the grown-up to agree to the privacy policy first. */
  function checkAgreed(): boolean {
    if (!agreed) { setError("Please read and agree to the Privacy Policy first."); return false; }
    rememberPrivacyAccepted();
    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkAgreed()) return;
    if (mode === "register" && password !== confirmPassword) { setError("The passwords don't match."); return; }
    setBusy(true);
    setError("");
    try {
      if (mode === "login") onSignedIn(await login(email, password));
      else setCodeSent(await register(name, email, password));
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  function continueWithGoogle() {
    if (!checkAgreed()) return;
    try { window.sessionStorage.setItem(PARENT_RETURN_KEY, "account"); } catch { /* The adult check will simply be asked again. */ }
    window.location.assign(googleSignInUrl("/grown-ups"));
  }

  function switchMode(next: "login" | "register") { setMode(next); setError(""); }

  if (codeSent) return <VerifyCodeStep sent={codeSent} onBack={() => { setCodeSent(null); setMode("register"); }} onSignedIn={onSignedIn} />;

  return <Card className="bg-white p-6 sm:p-8">
    <h2 className="text-2xl font-black text-ink">{mode === "login" ? "Sign in to your parent account" : "Create a parent account"}</h2>
    <p className="mt-2 text-sm leading-6 text-muted-ink">An account lets you manage a Play &amp; Learn subscription. Your child&apos;s game progress stays on this device either way.</p>

    <div role="group" aria-label="Account options" className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-cream p-1.5">{(["login", "register"] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => switchMode(item)} className={`min-h-11 rounded-full px-4 text-sm font-black transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${mode === item ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>{item === "login" ? "Sign in" : "Create account"}</button>)}</div>

    <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm leading-6 text-ink transition ${agreed ? "border-mint bg-mint/40" : "border-sunshine bg-sunshine/25"}`}>
      <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); if (event.target.checked) setError(""); }} className="mt-1 size-5 shrink-0 accent-[#30465D]" />
      <span><span className="font-black">I&apos;m a parent or guardian, and I have read and agree to the <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-4">Privacy Policy</a>.</span> <span className="text-muted-ink">It explains what we collect when you {mode === "login" ? "sign in" : "create an account"} and how we keep it safe.</span></span>
    </label>

    {providers?.google ? <><button type="button" onClick={continueWithGoogle} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border-2 border-ink/15 bg-white px-6 text-base font-extrabold text-ink transition hover:bg-cream focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"><GoogleLogo />Continue with Google</button><div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-muted-ink" aria-hidden="true"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div></> : <div className="mt-5" />}

    <form onSubmit={submit} className="grid gap-4">
      {mode === "register" ? <label className="block text-sm font-black text-ink">Your name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={80} className={inputClass} /></label> : null}
      <label className="block text-sm font-black text-ink">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} className={inputClass} /></label>
      <label className="block text-sm font-black text-ink">Password
        <span className="relative block"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} maxLength={128} className={`${inputClass} pr-20`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} className="absolute right-2 top-1/2 mt-1 min-h-9 -translate-y-1/2 rounded-full px-3 text-xs font-black text-ink hover:bg-white">{showPassword ? "Hide" : "Show"}</button></span>
        {mode === "register" ? <span className="mt-1 block text-xs font-bold text-muted-ink">At least 8 characters.</span> : null}
      </label>
      {mode === "register" ? <label className="block text-sm font-black text-ink">Confirm password
        <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required maxLength={128} aria-invalid={mismatch} aria-describedby={mismatch ? "password-mismatch" : undefined} className={mismatch ? inputClass.replace("border-sky", "border-coral") : inputClass} />
        {mismatch ? <span id="password-mismatch" className="mt-1 block text-xs font-bold text-ink">The passwords don&apos;t match yet.</span> : null}
      </label> : null}
      {error ? <p role="alert" className="rounded-2xl bg-coral/40 px-4 py-3 text-sm font-black text-ink">{error}</p> : null}
      <Button type="submit" disabled={busy} className="w-full disabled:opacity-60">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Email me a code"}</Button>
    </form>
  </Card>;
}

function SignedIn({ user, plan, onSignedOut }: { user: AuthUser; plan: PublicPlan | null; onSignedOut: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try { await logout(); onSignedOut(); }
    catch (caught) { setError(caught instanceof AuthError ? caught.message : "Couldn't sign out. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-6">
    <Card className="bg-white p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} />
        <div className="min-w-0"><h2 className="truncate text-2xl font-black text-ink">{user.name}</h2>{isPremiumUser(user) ? <PremiumChip className="mt-1" /> : null}<p className="mt-1 truncate text-sm font-bold text-muted-ink">{user.email}</p></div>
      </div>
      <p className="mt-4 text-sm text-muted-ink">Signs in with: <span className="font-black text-ink">{user.providers.map((provider) => provider === "google" ? "Google" : "Email & password").join(", ")}</span></p>
      {error ? <p role="alert" className="mt-4 rounded-2xl bg-coral/40 px-4 py-3 text-sm font-black text-ink">{error}</p> : null}
      <Button variant="secondary" onClick={signOut} disabled={busy} className="mt-5 disabled:opacity-60">{busy ? "Signing out…" : "Sign out"}</Button>
    </Card>
    <PremiumCard user={user} plan={plan} />
  </div>;
}

export function AccountPanel({ account, providers, plan, notice, onSignedIn, onSignedOut, onRetry }: { account: AccountState; providers: AuthProviders | null; plan: PublicPlan | null; notice: AccountNotice | null; onSignedIn: (user: AuthUser) => void; onSignedOut: () => void; onRetry: () => void }) {
  return <div className="grid gap-6">
    {notice ? <Notice notice={notice} /> : null}
    {account.status === "loading" ? <Card className="bg-white p-6 sm:p-8"><p className="text-sm font-black text-ink">Checking your account…</p></Card>
      : account.status === "error" ? <Card className="bg-white p-6 sm:p-8"><h2 className="text-2xl font-black text-ink">Account unavailable</h2><p className="mt-2 text-sm leading-6 text-muted-ink">{account.message}</p><Button variant="secondary" onClick={onRetry} className="mt-5">Try again</Button></Card>
      : account.status === "signed-in" ? <SignedIn user={account.user} plan={plan} onSignedOut={onSignedOut} />
      : <>
        {plan?.available ? <Card className="bg-sky p-6 sm:p-8"><p className="text-sm font-black uppercase tracking-[0.14em] text-muted-ink"><span aria-hidden="true">⭐ </span>{plan.name}</p><p className="mt-1 text-2xl font-black text-ink">{formatPrice(plan.amount, plan.currency)} for {durationText(plan.durationDays)}</p><p className="mt-1 text-sm leading-6 text-muted-ink">Sign in or create an account to unlock:</p><PremiumGames plan={plan} /></Card> : null}
        <SignInForm providers={providers} onSignedIn={onSignedIn} />
      </>}
  </div>;
}
