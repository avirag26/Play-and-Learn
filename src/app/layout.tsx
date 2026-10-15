import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import { OfflineStatus } from "@/components/layout/offline-status";
import "./globals.css";

export const metadata: Metadata = {
  title: "Play & Learn | Little Wonder World",
  description: "Little learning adventures for curious little minds.",
  applicationName: "Play & Learn",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon-192.svg", type: "image/svg+xml" }, { url: "/icon-512.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.svg" },
};

export const viewport: Viewport = { themeColor: "#E5F4FF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><ServiceWorkerRegistration /><OfflineStatus /><AppShell>{children}</AppShell></body>
    </html>
  );
}
