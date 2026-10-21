import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export type PolicySection = { id: string; title: string; body: ReactNode };

/** The shared layout for grown-up information pages: title, jump links, then one card per section. */
export function PolicyPage({ title, lastUpdated, intro, sections }: { title: string; lastUpdated?: string; intro?: ReactNode; sections: readonly PolicySection[] }) {
  return <main className="min-h-[calc(100vh-4.5rem)] bg-cream pb-16 pt-8 sm:pt-12"><div className="page-container mx-auto max-w-3xl">
    <Link href="/" className="text-sm font-black text-ink underline underline-offset-4">← Back home</Link>
    <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-muted-ink">For grown-ups</p>
    <h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-5xl">{title}</h1>
    {lastUpdated ? <p className="mt-3 text-sm font-bold text-muted-ink">Last updated {lastUpdated}</p> : null}
    {intro ? <div className="privacy-prose mt-4 text-base leading-7 text-muted-ink">{intro}</div> : null}

    <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">{sections.map((section) => <a key={section.id} href={`#${section.id}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-ink shadow-[0_2px_0_rgba(42,91,145,0.15)] hover:bg-sky">{section.title}</a>)}</nav>

    <div className="mt-8 grid gap-6">{sections.map((section) => <Card key={section.id} id={section.id} className="scroll-mt-24 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-black text-ink">{section.title}</h2>
      <div className="privacy-prose mt-3 text-base leading-7 text-muted-ink">{section.body}</div>
    </Card>)}</div>
  </div></main>;
}
