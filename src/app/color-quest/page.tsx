import { ColorQuest } from "@/features/color-quest/color-quest";
import { PremiumGate } from "@/features/games/premium-gate";

export default function ColorQuestPage() {
  return <PremiumGate gameId="color-quest" title="Color Quest"><ColorQuest /></PremiumGate>;
}
