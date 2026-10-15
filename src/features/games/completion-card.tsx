import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function CompletionCard({ title, message, stars, onPlayAgain }: { title: string; message: string; stars: number; onPlayAgain: () => void }) {
  return <Card className="mx-auto max-w-xl bg-white p-7 text-center sm:p-10"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-sunshine text-4xl text-ink">★</div><p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-muted-ink">Adventure complete</p><h2 className="mt-2 text-3xl font-black text-ink">{title}</h2><p className="mx-auto mt-3 max-w-sm leading-7 text-muted-ink">{message}</p><p className="mt-5 text-xl font-black text-ink">{stars} {stars === 1 ? "star" : "stars"} earned!</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={onPlayAgain}>Play again</Button><Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-extrabold text-ink hover:bg-cream focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Back home</Link></div></Card>;
}
