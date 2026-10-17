import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SettingsApplier } from "@/components/layout/settings-applier";
import { OfflineStatus } from "@/components/layout/offline-status";
import { PageContainer } from "@/components/ui/page-container";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="app-shell">
    <SettingsApplier />
    <a href="#app-content" className="skip-link">Skip to content</a>
    <MobileHeader />
    <OfflineStatus />
    <div id="app-content" className="app-content" tabIndex={-1}>{children}</div>
    <footer className="app-footer"><PageContainer><p className="font-black text-ink">Little Wonder World</p><p className="mt-1">Made for curious minds, with a grown-up nearby.</p></PageContainer></footer>
    <Suspense fallback={null}><AppNavigation placement="mobile" /></Suspense>
  </div>;
}
