"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * "list" on the server and for reduced motion, "ring" (full scene) otherwise.
 * Content is therefore always present without JS.
 */
export function useMotionMode(): "list" | "ring" {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(QUERY).matches ? "list" : "ring"),
    () => "list",
  );
}
