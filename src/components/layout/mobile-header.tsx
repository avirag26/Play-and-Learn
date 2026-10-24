import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AppNavigation, NavigationIcon } from "@/components/layout/app-navigation";
import { PageContainer } from "@/components/ui/page-container";

export function MobileHeader() {
  return <header className="app-header">
    <PageContainer className="flex min-h-16 items-center justify-between gap-3 py-2">
      <Link href="/" className="app-brand" aria-label="Play and Learn home">
        <Image src="/logo-mark.png" alt="" width={44} height={44} priority className="brand-logo" />
        <span>Play <span className="font-normal">&amp;</span> Learn</span>
      </Link>
      <Suspense fallback={<div className="hidden h-12 md:block" />}><AppNavigation placement="desktop" /></Suspense>
      <Link href="/grown-ups" aria-label="Open parent settings and progress" className="parent-entry"><NavigationIcon name="parent" /></Link>
    </PageContainer>
  </header>;
}
