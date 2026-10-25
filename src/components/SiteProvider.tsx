"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TickSound } from "@/lib/sound";
import { ScrollTrigger } from "@/lib/gsap";

type SiteContextValue = {
  soundOn: boolean;
  toggleSound: () => void;
  tick: () => void;
  section: string;
};

const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite must be used inside <SiteProvider>");
  return value;
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(false);
  const [section, setSection] = useState("hero");
  const sound = useRef<TickSound | null>(null);
  const soundOnRef = useRef(false);

  const toggleSound = useCallback(() => {
    sound.current ??= new TickSound();
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    if (next) sound.current.enable();
    else sound.current.disable();
    setSoundOn(next);
  }, []);

  const tick = useCallback(() => {
    if (soundOnRef.current) sound.current?.tick();
  }, []);

  // Silence when the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (!sound.current || !soundOnRef.current) return;
      if (document.hidden) sound.current.disable();
      else sound.current.enable();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Track the section in view, so a language switch can keep the reader's place.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set((e.target as HTMLElement).id, e.isIntersecting ? e.intersectionRatio : 0);
        let best = "";
        let ratio = 0;
        for (const [id, r] of visible) if (r > ratio) [best, ratio] = [id, r];
        if (best) setSection(best);
      },
      { threshold: [0, 0.15, 0.35, 0.6, 0.9] },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // Pins are measured late (fonts, glyph boxes), which moves sections down.
  // Until the reader interacts, keep re-landing on the hash target after every refresh.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let settled = false;
    const stop = () => {
      settled = true;
    };
    const land = () => {
      if (settled) return;
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    };
    const onRefresh = () => requestAnimationFrame(land);
    const opts = { once: true, passive: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("keydown", stop, opts);
    const timer = window.setTimeout(stop, 5000);
    ScrollTrigger.addEventListener("refresh", onRefresh);
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
    };
  }, []);

  const value = useMemo(() => ({ soundOn, toggleSound, tick, section }), [soundOn, toggleSound, tick, section]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
