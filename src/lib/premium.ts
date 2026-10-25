"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getPlan } from "@/lib/auth-client";

/**
 * Which games need Premium, and until when this device's signed-in parent has it.
 * Cached on the device so games still open (or stay locked) offline. This is a friendly lock for
 * children: the games themselves ship with the app, so it is not copy protection.
 */
export type Entitlement = { premiumGameIds: string[]; premiumUntil: string | null; /** Home Missions after `freeMissionDays` need Premium. */ missionsPremium: boolean; freeMissionDays: number };

export const PREMIUM_CACHE_KEY = "play-learn-premium-v1";

function readCache(): Entitlement | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(PREMIUM_CACHE_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const item = value as Partial<Entitlement>;
    return { premiumGameIds: Array.isArray(item.premiumGameIds) ? item.premiumGameIds.filter((id): id is string => typeof id === "string") : [], premiumUntil: typeof item.premiumUntil === "string" ? item.premiumUntil : null, missionsPremium: item.missionsPremium === true, freeMissionDays: freeDays(item.freeMissionDays) };
  } catch { return null; }
}

function writeCache(entitlement: Entitlement): void {
  try { window.localStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify(entitlement)); } catch { /* Storage is optional. */ }
}

/** Free mission days from the API or the cache: a whole number of days, 3 when unknown. */
function freeDays(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 3;
}

// `now` is always passed in: reading the clock while rendering breaks prerendering (Cache Components).
export function hasPremium(entitlement: Entitlement, now: number): boolean {
  return entitlement.premiumUntil !== null && new Date(entitlement.premiumUntil).getTime() > now;
}

/**
 * The first Home Missions day that needs Premium, or null when every day is open (missions are free,
 * or this device's parent has Premium).
 */
export function firstPremiumMissionDay(entitlement: Entitlement | null, now: number): number | null {
  return entitlement && entitlement.missionsPremium && !hasPremium(entitlement, now) ? entitlement.freeMissionDays + 1 : null;
}

export function isGameLocked(entitlement: Entitlement | null, gameId: string, now: number): boolean {
  return entitlement !== null && entitlement.premiumGameIds.includes(gameId) && !hasPremium(entitlement, now);
}

const REVEALED_KEY = "play-learn-unlock-revealed-v1";

/** True the first time this device shows a given Premium period, so the locks can pop open once after buying. */
export function isUnlockNew(premiumUntil: string): boolean {
  try { return window.localStorage.getItem(REVEALED_KEY) !== premiumUntil; } catch { return false; }
}

export function markUnlockSeen(premiumUntil: string): void {
  try { window.localStorage.setItem(REVEALED_KEY, premiumUntil); } catch { /* The locks will just pop open again next time. */ }
}

let pending: Promise<Entitlement | null> | null = null;
const listeners = new Set<(entitlement: Entitlement | null) => void>();

/** Asks the API (once at a time); falls back to the cached answer when offline. */
export function refreshPremium(): Promise<Entitlement | null> {
  pending ??= Promise.all([getPlan(), getCurrentUser()])
    .then(([plan, user]) => {
      const entitlement: Entitlement = { premiumGameIds: plan.premiumGameIds, premiumUntil: user?.subscription.status === "active" ? user.subscription.currentPeriodEnd : null, missionsPremium: plan.missionsPremium === true, freeMissionDays: freeDays(plan.freeMissionDays) };
      writeCache(entitlement);
      return entitlement;
    }, () => readCache())
    .then((entitlement) => { listeners.forEach((listener) => listener(entitlement)); return entitlement; })
    .finally(() => { pending = null; });
  return pending;
}

type PremiumState = { entitlement: Entitlement | null; checked: boolean; now: number };

/**
 * The current entitlement: the cached one straight away, then the API's answer.
 * `checked` is false until the API (or the offline fallback) has answered. `now` is when the
 * entitlement was read, taken in an effect (never during render) for use with isGameLocked.
 */
export function usePremium(): PremiumState {
  const [state, setState] = useState<PremiumState>({ entitlement: null, checked: false, now: 0 });
  useEffect(() => {
    const listener = (entitlement: Entitlement | null) => setState({ entitlement, checked: true, now: Date.now() });
    listeners.add(listener);
    const timer = window.setTimeout(() => { setState((current) => current.checked ? current : { entitlement: readCache(), checked: false, now: Date.now() }); void refreshPremium(); }, 0);
    return () => { listeners.delete(listener); window.clearTimeout(timer); };
  }, []);
  return state;
}
