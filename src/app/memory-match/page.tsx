import { PremiumGate } from "@/features/games/premium-gate";
import { MemoryMatch } from "@/features/memory-match/memory-match";

export default function MemoryMatchPage() {
  return <PremiumGate gameId="memory-match" title="Memory Match"><MemoryMatch /></PremiumGate>;
}
