import { PremiumGate } from "@/features/games/premium-gate";
import { ShapeSafari } from "@/features/shape-safari/shape-safari";

export default function ShapeSafariPage() {
  return <PremiumGate gameId="shape-safari" title="Shape Safari"><ShapeSafari /></PremiumGate>;
}
