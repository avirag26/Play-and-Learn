const items = [
  { label: "Home", href: "#top", icon: "⌂" },
  { label: "Explore", href: "#explore", icon: "✦" },
  { label: "Missions", href: "/missions", icon: "♡" },
  { label: "Progress", href: "#progress", icon: "★" },
] as const;

export function BottomNav() {
  return <nav aria-label="Child navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e7edf1] bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_20px_rgba(66,97,120,0.08)] backdrop-blur sm:hidden"><div className="mx-auto grid max-w-md grid-cols-4 gap-1">{items.map((item, index) => <a key={item.label} href={item.href} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-black focus-visible:outline-3 focus-visible:outline-offset-[-2px] focus-visible:outline-ink ${index === 0 ? "bg-sky text-ink" : "text-muted-ink hover:bg-cream"}`} aria-current={index === 0 ? "page" : undefined}><span aria-hidden="true" className="text-xl leading-6">{item.icon}</span><span>{item.label}</span></a>)}</div></nav>;
}
