"use client";

import { useLayoutEffect } from "react";

/**
 * Marks the visible page as a full-screen phone layout (`html[data-fill-screen]`).
 * Cache Components keeps visited pages in the DOM but hidden, so a CSS `:has()` check would
 * still match after leaving; this marker is removed as soon as the page is hidden.
 */
export function FillScreenMarker() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.fillScreen = "true";
    return () => { delete root.dataset.fillScreen; };
  }, []);
  return null;
}
