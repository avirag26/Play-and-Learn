"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => { const update = () => setOffline(!navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  if (!offline) return null;
  return <div role="status" aria-live="polite" className="bg-ink px-4 py-3 text-center text-sm font-black text-white">You&apos;re offline — saved activities can still work.</div>;
}
