"use client";

import { useSyncExternalStore } from "react";

// Review switch for the floating-visor comparison (?visor=v1). Remove once a version is chosen.
export function useVisorVariant(): "v1" | "v2" {
  return useSyncExternalStore(
    () => () => {},
    () => (new URLSearchParams(window.location.search).get("visor") === "v1" ? "v1" : "v2"),
    () => "v2",
  );
}
