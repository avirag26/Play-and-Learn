"use client";

import { useId } from "react";
import type { AuthUser } from "@/lib/auth-client";

export const isPremiumUser = (user: AuthUser) => user.subscription.status === "active";

/** A gold, gem-studded crown. */
export function Crown({ className = "" }: { className?: string }) {
  const id = useId();
  return <svg viewBox="0 0 32 26" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe680" /><stop offset=".55" stopColor="#ffc22e" /><stop offset="1" stopColor="#f29a0c" /></linearGradient>
    </defs>
    <path d="M3 9.5 9.5 15 16 4l6.5 11L29 9.5 26.5 22h-21Z" fill={`url(#${id}-gold)`} stroke="#b8650a" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="5" y="20.5" width="22" height="4" rx="1.6" fill={`url(#${id}-gold)`} stroke="#b8650a" strokeWidth="1.6" />
    <circle cx="16" cy="3.4" r="2.4" fill="#ff6f91" stroke="#b8650a" strokeWidth="1.2" />
    <circle cx="3" cy="8.8" r="2" fill="#5fb4ff" stroke="#b8650a" strokeWidth="1.2" />
    <circle cx="29" cy="8.8" r="2" fill="#5fb4ff" stroke="#b8650a" strokeWidth="1.2" />
    <circle cx="16" cy="16" r="2" fill="#7ad9a6" stroke="#b8650a" strokeWidth="1" />
    <path d="M8 12.5 9.5 14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
  </svg>;
}

/** Profile picture (or initial). Premium parents get a shimmering gold ring and a crown. */
export function UserAvatar({ user, size = "md" }: { user: AuthUser; size?: "sm" | "md" }) {
  const premium = isPremiumUser(user);
  const box = size === "sm" ? "size-8" : "size-16";
  const inner = <>
    {/* A tiny external profile photo; next/image optimisation is not worth allow-listing Google's image hosts. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-full rounded-full bg-sky object-cover" />
      : <span aria-hidden="true" className={`grid size-full place-items-center rounded-full bg-lavender font-black text-ink ${size === "sm" ? "text-sm" : "text-2xl"}`}>{user.name.slice(0, 1).toUpperCase()}</span>}
  </>;
  if (!premium) return <span className={`block shrink-0 ${box}`}>{inner}</span>;
  return <span className={`premium-avatar relative block shrink-0 rounded-full ${size === "sm" ? "p-[2px]" : "p-[3px]"} ${box}`}>
    <span className="block size-full rounded-full bg-white p-[2px]">{inner}</span>
    <Crown className={`premium-crown absolute drop-shadow-[0_1px_0_rgba(0,0,0,0.15)] ${size === "sm" ? "-right-1.5 -top-2 w-4" : "-right-2 -top-3.5 w-8 rotate-[18deg]"}`} />
  </span>;
}

/** Gold "Premium" chip shown next to a Premium parent's name. */
export function PremiumChip({ className = "" }: { className?: string }) {
  return <span className={`premium-chip inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.12em] text-[#6b3a00] ${className}`}><Crown className="w-3.5" />Premium</span>;
}
