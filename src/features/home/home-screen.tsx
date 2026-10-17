import Link from "next/link";
import { BearMascot } from "@/features/home/illustrations";

export function HomeScreen() {
  return (
    <main className="home-screen page-container bg-world-blue">
      <div className="home-panel">
        <div className="home-welcome">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/70">Little Wonder World</p>
          <h1 className="home-title font-black tracking-tight text-ink">Play &amp; Learn</h1>
          <p className="home-intro text-ink/80">Explore A–Z with your friendly little bear.</p>
        </div>
        <div className="home-game rounded-3xl bg-white/85">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Game 1</p>
          <h2 className="home-game-title font-black text-ink">Alphabet Adventure</h2>
          <p className="home-game-description text-muted-ink">Discover letters, find them, and match pictures.</p>
          <div className="home-actions">
            <Link href="/alphabet-adventure" className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-4 py-3 text-center text-sm font-black text-white shadow-[0_4px_0_#22384c] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">
              <span className="text-white">Play Alphabet Adventure <span aria-hidden="true">→</span></span>
            </Link>
            <Link href="/missions" className="inline-flex min-h-11 items-center justify-center rounded-full bg-cream px-4 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Home Missions</Link>
          </div>
        </div>
        <div className="home-mascot">
          <BearMascot className="h-full w-full" />
        </div>
      </div>
    </main>
  );
}
