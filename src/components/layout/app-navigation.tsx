"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { label: "Home", href: "/", icon: "home", prefixes: [] },
  { label: "Games", href: "/alphabet-adventure", icon: "games", prefixes: ["/alphabet-adventure", "/games"] },
  { label: "Missions", href: "/missions", icon: "missions", prefixes: ["/missions"] },
  { label: "Parent", href: "/grown-ups", icon: "parent", prefixes: ["/grown-ups"] },
] as const;

export function NavigationIcon({ name }: { name: "home" | "games" | "missions" | "parent" }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "home" ? <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></> : null}
    {name === "games" ? <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></> : null}
    {name === "missions" ? <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m9 12 2 2 4-4" /></> : null}
    {name === "parent" ? <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></> : null}
  </svg>;
}

export function AppNavigation({ placement }: { placement: "mobile" | "desktop" }) {
  const pathname = usePathname();
  return <nav aria-label={placement === "mobile" ? "Mobile navigation" : "Main navigation"} className={placement === "mobile" ? "mobile-navigation" : "desktop-navigation"}>
    {destinations.map((item) => {
      const active = item.href === "/" ? pathname === "/" : item.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.icon === "parent" ? "Parent settings and progress" : item.label} className="app-nav-link">
        <span className="app-nav-icon"><NavigationIcon name={item.icon} /></span>
        <span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
