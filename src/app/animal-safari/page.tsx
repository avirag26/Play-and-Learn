import { AnimalSafari } from "@/features/animal-safari/animal-safari";
import { PremiumGate } from "@/features/games/premium-gate";

export default function AnimalSafariPage() {
  return <PremiumGate gameId="animal-safari" title="Animal Safari"><AnimalSafari /></PremiumGate>;
}
