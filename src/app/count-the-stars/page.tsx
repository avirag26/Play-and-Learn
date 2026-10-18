import { CountTheStars } from "@/features/count-the-stars/count-the-stars";
import { PremiumGate } from "@/features/games/premium-gate";

export default function CountTheStarsPage() {
  return <PremiumGate gameId="count-the-stars" title="Count the Stars"><CountTheStars /></PremiumGate>;
}
