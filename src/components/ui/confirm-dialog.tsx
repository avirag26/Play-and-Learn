"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = { open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void; children?: ReactNode };

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Not yet", onConfirm, onCancel, children }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); onCancel(); }} onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className="p-5 sm:p-7">
      <div aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sunshine text-2xl font-black text-ink">?</div>
      <h2 id={`${id}-title`} className="mt-5 text-center text-2xl font-black text-ink">{title}</h2>
      <p id={`${id}-description`} className="mt-3 text-center leading-7 text-muted-ink">{description}</p>
      {children}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <button ref={cancelRef} type="button" onClick={onCancel} className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-black text-ink hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">{cancelLabel}</button>
        <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </dialog>;
}
