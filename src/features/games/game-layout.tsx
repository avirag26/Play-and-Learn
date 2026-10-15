"use client";

import type { ReactNode, MouseEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type GameLayoutProps = { title: string; eyebrow: string; current: number; total: number; children: ReactNode; dirty?: boolean };

export function GameLayout({ title, eyebrow, current, total, children, dirty = false }: GameLayoutProps) {
  const [exitOpen, setExitOpen] = useState(false);
  const router = useRouter();
  function requestExit(event: MouseEvent<HTMLAnchorElement>) { if (dirty) { event.preventDefault(); setExitOpen(true); } }
  return <main className="min-h-[calc(100vh-4.5rem)] bg-cream pb-12 pt-6 sm:pt-10"><PageContainer className="max-w-4xl"><div className="mb-6 flex items-center justify-between gap-4"><Link href="/" onClick={requestExit} className="inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-white px-4 text-sm font-black text-ink shadow-[0_3px_0_rgba(66,97,120,0.1)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">← Exit</Link><div className="text-right"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">{eyebrow}</p><p className="text-sm font-black text-ink">{current} of {total}</p></div></div><div className="mb-8 h-3 overflow-hidden rounded-full border-2 border-white bg-white" aria-label={`Question ${current} of ${total}`} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}><div className="h-full rounded-full bg-sunshine transition-all" style={{ width: `${(current / total) * 100}%` }} /></div><h1 className="sr-only">{title}</h1>{children}</PageContainer><ConfirmDialog open={exitOpen} title="Leave this adventure?" description="Your current answer will be cleared. You can always come back and start a fresh adventure." confirmLabel="Leave game" onCancel={() => setExitOpen(false)} onConfirm={() => router.push("/")} /></main>;
}
