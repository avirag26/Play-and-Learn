import { AlphabetAdventure } from "@/features/alphabet/alphabet-adventure";
import { PremiumGate } from "@/features/games/premium-gate";

export default function AlphabetAdventurePage() {
  return <PremiumGate gameId="alphabet-adventure" title="Alphabet Adventure"><AlphabetAdventure /></PremiumGate>;
}
