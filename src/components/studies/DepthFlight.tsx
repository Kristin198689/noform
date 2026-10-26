"use client";

import { Img } from "@/components/Img";
import { Wordmark } from "@/components/Wordmark";
import { clamp01, GALLERY, smooth, useScrollScene } from "@/lib/studies";
import { useMotionMode } from "@/lib/useMotionMode";
import { cue } from "@/lib/sound";
import styles from "./Studies.module.css";

const FRAMES = 22;
// lateral offsets in viewport units; frames alternate sides so the camera passes between them
const OFFSETS = Array.from({ length: FRAMES }, (_, i) => {
  const side = i % 4;
  const x = side === 0 ? -0.62 : side === 1 ? 0.6 : side === 2 ? -0.32 : 0.36;
  const y = side === 2 ? -0.46 : side === 3 ? 0.44 : i % 3 === 0 ? 0.12 : -0.1;
  return { x, y };
});
const END = FRAMES + 0.6;

/**
 * Study 04 — Flight through frames. Campaign photographs at increasing depth; the camera flies between
 * them (real perspective), near frames sweep past the edges, then the wordmark arrives from the depth.
 */
export function DepthFlight() {
  const mode = useMotionMode();

  const root = useScrollScene(mode === "ring", 3.4, (el) => {
    const frames = Array.from(el.querySelectorAll<HTMLElement>("[data-frame]"));
    const mark = el.querySelector<HTMLElement>("[data-mark]");
    const readout = el.querySelector<HTMLElement>("[data-readout]");
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };
    let passed = -1;
    let lastP = 0;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      lean.tx = (e.clientX / window.innerWidth - 0.5) * 80;
      lean.ty = (e.clientY / window.innerHeight - 0.5) * 50;
    };
    if (fine) el.addEventListener("pointermove", onMove);

    const render = (p: number) => {
      lastP = p;
      lean.x += (lean.tx - lean.x) * 0.1;
      lean.y += (lean.ty - lean.y) * 0.1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cam = -0.6 + smooth(p / 0.8) * (END + 0.6);
      let count = 0;
      for (let i = 0; i < FRAMES; i++) {
        const f = frames[i];
        const o = OFFSETS[i]!;
        if (!f) continue;
        const rel = i - cam;
        if (rel <= -0.7) {
          f.style.opacity = "0";
          count++;
          continue;
        }
        const s = 1 / (1 + rel);
        const x = o.x * w * 0.5 * s + lean.x * (1 - s * 0.4);
        const y = o.y * h * 0.5 * s + lean.y * (1 - s * 0.4);
        const near = clamp01((4 - s) / 2);
        const far = clamp01((FRAMES - rel) / 4);
        f.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
        f.style.opacity = Math.min(near, far).toFixed(3);
        f.style.zIndex = String(Math.round(s * 100));
        if (rel < 0) count++;
      }
      if (count !== passed) {
        if (passed !== -1 && count > passed) cue("tick");
        passed = count;
      }
      if (mark) {
        const rel = END + 0.4 - cam;
        const s = Math.min(1, 1 / (1 + Math.max(0, rel)));
        mark.style.transform = `translate3d(${(lean.x * 0.3).toFixed(1)}px, ${(lean.y * 0.3).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
        mark.style.opacity = smooth((p - 0.55) / 0.25).toFixed(3);
      }
      if (readout) readout.textContent = `DEPTH ${String(Math.min(FRAMES, count + 1)).padStart(2, "0")} / ${FRAMES}`;
    };
    // keep the cursor lean easing even when the scroll is still
    const idle = window.setInterval(() => {
      if (Math.abs(lean.tx - lean.x) > 0.5 || Math.abs(lean.ty - lean.y) > 0.5) render(lastP);
    }, 32);
    return {
      render,
      dispose: () => {
        window.clearInterval(idle);
        el.removeEventListener("pointermove", onMove);
      },
    };
  });

  return (
    <section ref={root} id="study-depth" data-section data-theme="dark" className={styles.scene} data-mode={mode} aria-label="Study 04 — flight through frames">
      <p className={`micro ${styles.label}`} aria-hidden="true">STUDY 04 / FLIGHT THROUGH FRAMES</p>
      <p className={`micro ${styles.labelR}`} aria-hidden="true">
        <span data-readout>DEPTH 01 / 14</span>
      </p>
      <p className={`micro ${styles.foot}`} aria-hidden="true">SCROLL TO FLY</p>
      <p className={`micro ${styles.footR}`} aria-hidden="true">CAMPAIGN / 2026</p>
      <div className={styles.stage}>
        {Array.from({ length: FRAMES }, (_, i) => {
          const id = GALLERY[(i * 2 + 1) % GALLERY.length]!;
          return (
            <div key={i} className={`${styles.item} ${styles.depthFrame}`} data-frame data-wide={id === "look-04" || id === "look-05" || id === "hero" || id === "visor-front" ? "" : undefined}>
              <Img id={id} alt="" sizes="(max-width: 767px) 60vw, 30vw" draggable={false} />
            </div>
          );
        })}
      </div>
      <div className={styles.mark} data-mark>
        <Wordmark label="NØFORM" />
      </div>
    </section>
  );
}
