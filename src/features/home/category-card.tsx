import { Card } from "@/components/ui/card";
import { CategoryIllustration } from "@/features/home/illustrations";

type CategoryCardProps = { label: string; description: string; kind: "alphabet" | "numbers" | "animals" | "colors" | "shapes"; color: string; href: string };

export function CategoryCard({ label, description, kind, color, href }: CategoryCardProps) {
  return <Card className={`group overflow-hidden ${color}`}><a href={href} className="block min-h-44 p-4 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ink sm:min-h-48 sm:p-5"><CategoryIllustration kind={kind} className="h-20 w-full transition-transform group-hover:scale-105 sm:h-24" /><h3 className="mt-2 text-lg font-black text-ink">{label}</h3><p className="mt-0.5 text-sm font-bold text-ink/65">{description}</p><span className="mt-3 inline-flex text-sm font-black text-ink underline decoration-2 underline-offset-4">Explore <span aria-hidden="true" className="ml-1">→</span></span></a></Card>;
}
