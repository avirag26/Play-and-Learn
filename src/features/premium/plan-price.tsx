"use client";

import { useEffect, useState } from "react";
import { durationText, formatPrice, getPlan } from "@/lib/auth-client";
import { games } from "@/lib/games";
import { FALLBACK_PLAN } from "@/lib/site-info";

type ShownPlan = { name: string; amount: number; currency: string; durationDays: number; premiumGameIds: string[] | null; available: boolean | null };

const fallback: ShownPlan = { ...FALLBACK_PLAN, premiumGameIds: null, available: null };

/** The Premium plan as the admin app last saved it, or the default plan until (or unless) the API answers. */
function useShownPlan(): ShownPlan {
  const [plan, setPlan] = useState<ShownPlan>(fallback);
  useEffect(() => {
    let current = true;
    getPlan().then((live) => { if (current) setPlan(live); }, () => { /* Keep the default plan. */ });
    return () => { current = false; };
  }, []);
  return plan;
}

/** Inline price text, e.g. "₹199 for 1 month". */
export function PlanPriceText() {
  const plan = useShownPlan();
  return <>{formatPrice(plan.amount, plan.currency)} for {durationText(plan.durationDays)}</>;
}

/** The pricing card on the features page: free vs Premium, with the live price. */
export function PlanPricing() {
  const plan = useShownPlan();
  const premium = plan.premiumGameIds ? games.filter((game) => plan.premiumGameIds?.includes(game.id)) : null;
  const free = premium ? games.filter((game) => !premium.includes(game)) : null;

  return <div className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-[1.5rem] bg-cream p-6">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-ink">Free</p>
      <p className="mt-1 text-3xl font-black text-ink">₹0</p>
      <p className="mt-1 text-sm leading-6 text-muted-ink">No account needed.</p>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink">
        {free?.length ? free.map((game) => <li key={game.id}><span aria-hidden="true">{game.emoji} </span>{game.title}</li>) : null}
        <li><span aria-hidden="true">🏡 </span>Home Missions</li>
        <li><span aria-hidden="true">📊 </span>Parent dashboard and settings</li>
      </ul>
    </div>
    <div className="rounded-[1.5rem] border-2 border-ink bg-sunshine/60 p-6">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-ink"><span aria-hidden="true">⭐ </span>{plan.name}</p>
      <p className="mt-1 text-3xl font-black text-ink">{formatPrice(plan.amount, plan.currency)} <span className="text-base font-bold text-muted-ink">for {durationText(plan.durationDays)}</span></p>
      <p className="mt-1 text-sm leading-6 text-muted-ink">One-time payment in Indian Rupees. No automatic renewal.</p>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-ink">
        {premium?.length ? premium.map((game) => <li key={game.id}><span aria-hidden="true">{game.emoji} </span>{game.title}</li>) : <li><span aria-hidden="true">🔓 </span>Every Premium game</li>}
        <li><span aria-hidden="true">✅ </span>Everything in Free</li>
      </ul>
      {plan.available === false ? <p className="mt-4 rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold text-muted-ink">Premium isn&apos;t on sale right now. Please check back soon.</p> : null}
    </div>
  </div>;
}
