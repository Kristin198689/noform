"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// One timeline tool for the whole site; no smooth-scroll library.
ScrollTrigger.config({ ignoreMobileResize: true });

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Re-measure every scene in page order. Pins created late (e.g. after fonts change a scene's size)
 * would otherwise be measured before the scenes below them, shifting every later trigger.
 */
export function refreshInOrder(): void {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger, useGSAP };
