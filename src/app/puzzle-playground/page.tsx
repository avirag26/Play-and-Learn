import { PremiumGate } from "@/features/games/premium-gate";
import { PuzzlePlayground } from "@/features/puzzle-playground/puzzle-playground";

export default function PuzzlePlaygroundPage() {
  return <PremiumGate gameId="puzzle-playground" title="Puzzle Playground"><PuzzlePlayground /></PremiumGate>;
}
