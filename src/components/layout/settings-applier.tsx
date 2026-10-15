"use client";

import { useEffect } from "react";
import { readSettings } from "@/lib/app-settings";

export function SettingsApplier() {
  useEffect(() => {
    const settings = readSettings();
    document.documentElement.dataset.theme = settings.warmTheme ? "warm" : "soft";
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  }, []);
  return null;
}
