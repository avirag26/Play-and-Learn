import { GameGrid } from "@/features/games/game-grid";
import { GameScreen } from "@/features/games/game-ui";
import { games } from "@/lib/games";

export default function GamesPage() {
  return <GameScreen active={false}>
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">{games.length} games to play</p>
        <h1 className="text-2xl font-black text-ink sm:text-4xl">Choose a game</h1>
        <p className="mt-1 text-sm text-muted-ink sm:text-base">Tap a game to see all the ways to play it.</p>
      </div>
      <span aria-hidden="true" className="text-4xl sm:text-6xl">🎮</span>
    </div>
    <div className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-8"><GameGrid showModes /></div>
  </GameScreen>;
}
