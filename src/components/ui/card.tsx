import type { HTMLAttributes, ReactNode } from "react";
export function Card({ children, className="", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) { return <div className={`rounded-[2rem] border-2 border-white/80 bg-white shadow-[0_8px_0_rgba(42,91,145,0.25)] ${className}`} {...props}>{children}</div>; }
