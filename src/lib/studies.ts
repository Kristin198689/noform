"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { MediaId } from "@/components/Img";

/** Campaign photographs from the gallery, used by the four candidate scenes. */
export const GALLERY: MediaId[] = ["look-01", "look-03", "look-04", "look-05", "look-06", "visor-front", "hero"];

/** Glyph spans of the approved wordmark (path units, measured from the SVG). */
export const GLYPHS = [
  { ch: "N", x0: 53, x1: 776 },
  { ch: "Ø", x0: 853, x1: 1603 },
  { ch: "F", x0: 1682, x1: 2157 },
  { ch: "O", x0: 2214, x1: 2957 },
  { ch: "R", x0: 3045, x1: 3654 },
  { ch: "M", x0: 3721, x1: 4724 },
] as const;
export const GLYPH_Y = { top: 236, bottom: 963 };
export const WORD = { x0: 53, x1: 4724, cx: (53 + 4724) / 2, w: 4724 - 53, h: 963 - 236 };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Pin a scene and drive `render(progress)` from a smoothed scroll progress.
 * The ticker only runs while the scene is near the viewport; nothing runs for reduced motion.
 */
export function useScrollScene(
  enabled: boolean,
  lengthVh: number,
  setup: (root: HTMLElement) => { render: (p: number) => void; dispose?: () => void } | void,
) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!enabled || !root.current) return;
      const scene = setup(root.current);
      if (!scene) return;
      const { render, dispose } = scene;
      const state = { target: 0, cur: 0 };
      render(0);
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: () => `+=${window.innerHeight * lengthVh}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          state.target = self.progress;
        },
      });
      const loop = () => {
        const d = state.target - state.cur;
        if (Math.abs(d) < 0.0004) return;
        state.cur += d * Math.min(1, 0.12 * gsap.ticker.deltaRatio());
        render(state.cur);
      };
      let running = false;
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * (lengthVh + 2)}`,
        onToggle: (self) => {
          if (self.isActive && !running) {
            gsap.ticker.add(loop);
            running = true;
          } else if (!self.isActive && running) {
            gsap.ticker.remove(loop);
            running = false;
          }
        },
      });
      return () => {
        gsap.ticker.remove(loop);
        dispose?.();
      };
    },
    { scope: root, dependencies: [enabled], revertOnUpdate: true },
  );
  return root;
}

/** Horizontal drag that adds to a value; vertical swipes still scroll (touch-action: pan-y). */
export function attachDrag(el: HTMLElement, onDelta: (dx: number) => void): () => void {
  let last = 0;
  let down = false;
  const pd = (e: PointerEvent) => {
    if (e.button !== 0) return;
    down = true;
    last = e.clientX;
    el.setPointerCapture(e.pointerId);
  };
  const pm = (e: PointerEvent) => {
    if (!down) return;
    onDelta(e.clientX - last);
    last = e.clientX;
  };
  const pu = (e: PointerEvent) => {
    down = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };
  el.addEventListener("pointerdown", pd);
  el.addEventListener("pointermove", pm);
  el.addEventListener("pointerup", pu);
  el.addEventListener("pointercancel", pu);
  return () => {
    el.removeEventListener("pointerdown", pd);
    el.removeEventListener("pointermove", pm);
    el.removeEventListener("pointerup", pu);
    el.removeEventListener("pointercancel", pu);
  };
}

/** Fires once each time `p` rises past `at` (re-armed after it falls back below `at - 0.05`). */
export function onceAbove(at: number, fire: () => void): (p: number) => void {
  let armed = true;
  return (p) => {
    if (armed && p >= at) {
      armed = false;
      fire();
    } else if (!armed && p < at - 0.05) armed = true;
  };
}
