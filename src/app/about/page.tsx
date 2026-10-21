import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/layout/policy-page";
import { PlanPricing } from "@/features/premium/plan-price";
import { games } from "@/lib/games";
import { homeMissions, missionCategories } from "@/lib/missions";

export const metadata: Metadata = {
  title: "Features & Pricing | Play & Learn",
  description: "What Play & Learn offers children aged 3–6 and their parents, and what Premium costs.",
};

const sections: readonly PolicySection[] = [
  { id: "games", title: "Learning games", body: <>
    <p>Short, playful games that teach early skills through tapping, listening and colouring. Each game has several ways to play.</p>
    <ul className="!list-none !pl-0 !gap-3 sm:grid-cols-2">{games.map((game) => <li key={game.id} className="flex items-start gap-3 rounded-2xl bg-cream p-4">
      <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${game.tint}`}>{game.emoji}</span>
      <span><strong className="block">{game.title}</strong><span className="block text-sm">{game.description}</span><span className="block text-sm">{game.modes.filter((mode) => !mode.soon).map((mode) => mode.label).join(" · ")}</span></span>
    </li>)}</ul>
  </> },
  { id: "missions", title: "Home Missions", body: <>
    <p>{homeMissions.length} real-world activities that take learning off the screen and around the home, done together with a grown-up:</p>
    <ul>{missionCategories.map((category) => <li key={category}>{category}</li>)}</ul>
  </> },
  { id: "grown-ups", title: "For parents", body: <ul>
    <li><strong>Progress dashboard</strong> showing what your child has explored in each game and mission.</li>
    <li><strong>Settings</strong> for age range (3–4 or 5–6), sound and spoken words, reduced movement, a warm colour theme and play-time reminders.</li>
    <li>The parent area sits behind a grown-up check, so children stay in the play areas.</li>
  </ul> },
  { id: "safe", title: "Made safe for children", body: <ul>
    <li>No ads, no in-game purchases aimed at children, no chats and no tracking.</li>
    <li>Children never need an account. Their progress stays on your device.</li>
    <li>Real animal recordings and spoken letters, with nothing that links children away from the app.</li>
  </ul> },
  { id: "devices", title: "Works on any device", body: <ul>
    <li>Runs in the browser on phones, tablets and computers. You can add it to your home screen like an app.</li>
    <li>Pages you have opened once keep working offline.</li>
  </ul> },
  { id: "pricing", title: "Pricing", body: <>
    <PlanPricing />
    <p>Premium is a one-time payment that unlocks the Premium games for the period shown. It does <strong>not renew automatically</strong>, so there is nothing to cancel. Buying again adds the time on top of what is left.</p>
    <p>To buy, open the <Link href="/grown-ups">Parent area</Link>, create a free parent account and choose <strong>Get Premium</strong>. Payment is handled securely by our payment partner (Razorpay) by UPI, card, net banking or wallet.</p>
    <p>See our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link> and <Link href="/terms">Terms &amp; Conditions</Link>.</p>
  </> },
  { id: "contact", title: "Questions?", body: <p>We&apos;re happy to help. See our <Link href="/contact">contact details</Link>.</p> },
];

export default function AboutPage() {
  return <PolicyPage title="Features & Pricing" intro={<p>Play &amp; Learn is a learning app for children aged 3 to 6: letters, numbers, colours and animals, plus home activities to do together.</p>} sections={sections} />;
}
