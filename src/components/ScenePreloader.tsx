"use client";

import { useEffect } from "react";

/**
 * Native lazy loading starts too late for scroll scenes (≈1 screen ahead, and pins stretch the page).
 * When a section comes within 2.5 viewports, its images switch to eager — one scene at a time,
 * so bandwidth goes to what is next, not to everything at once.
 * Scanner masks listen for the same signal through `data-near`.
 */
export function ScenePreloader() {
  useEffect(() => {
    // Nested scenes (e.g. the floating visor) form their own group so they queue after the section's first frame.
    const GROUP = "[data-section], [data-preload-group]";
    const sections = Array.from(document.querySelectorAll<HTMLElement>(GROUP));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.near = "true";
          el.querySelectorAll<HTMLImageElement>("img[data-lazy]").forEach((img) => {
            if (img.parentElement?.closest(GROUP) === el) img.loading = "eager";
          });
          el.dispatchEvent(new CustomEvent("scene:near"));
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px 250% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return null;
}
