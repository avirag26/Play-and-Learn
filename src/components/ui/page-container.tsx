import type { ReactNode } from "react";
export function PageContainer({ children, className="" }: { children: ReactNode; className?: string }) { return <div className={`page-container mx-auto w-full min-w-0 max-w-6xl ${className}`}>{children}</div>; }
