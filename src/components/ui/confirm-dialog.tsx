"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = { open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; children?: ReactNode };

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Not yet", onConfirm, onCancel, children }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-5 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="w-full max-w-md rounded-[2rem] border-4 border-white bg-cream p-6 shadow-[0_12px_0_rgba(38,91,151,0.3)]" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl border-2 border-ink bg-sunshine text-2xl text-ink">?</div><h2 id="confirm-dialog-title" className="mt-5 text-center text-2xl font-black text-ink">{title}</h2><p id="confirm-dialog-description" className="mt-3 text-center leading-7 text-muted-ink">{description}</p>{children}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center"><button ref={cancelRef} type="button" onClick={onCancel} className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-black text-ink hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">{cancelLabel}</button><Button type="button" onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;
}
