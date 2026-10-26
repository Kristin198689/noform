"use client";

import { Img } from "@/components/Img";
import { Wordmark } from "@/components/Wordmark";
import { attachDrag, clamp01, GALLERY, lerp, onceAbove, smooth, useScrollScene, WORD } from "@/lib/studies";
import { useMotionMode } from "@/lib/useMotionMode";
import { cue } from "@/lib/sound";
import { WORDMARK_PATH } from "@/lib/wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./Studies.module.css";

const TILES = 140;

/** Cell centres (wordmark units, centred) of a grid laid over the letterforms. */
function mosaicCells(target: number): { x: number; y: number; size: number }[] {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  if (!ctx) return [];
  const path = new Path2D(WORDMARK_PATH);
  let best: { x: number; y: number; size: number }[] = [];
  for (let cols = 14; cols <= 60; cols++) {
    const size = WORD.w / cols;
    const cells: { x: number; y: number; size: number }[] = [];
    for (let gy = 236 + size / 2; gy < 963; gy += size)
      for (let gx = WORD.x0 + size / 2; gx < WORD.x1; gx += size)
        if (ctx.isPointInPath(path, gx, gy)) cells.push({ x: gx - WORD.cx, y: gy - 600, size });
    best = cells;
    if (cells.length >= target) break;
  }
  return best;
}

/**
 * Study 02 — Helix archive. Square tiles of the campaign hang on a 3D helix; the camera rises along it
 * (scroll), the helix turns (drag adds), then the tiles fly in a wave into a mosaic of the wordmark.
 */
export function HelixArchive({
  t,
}: {
  t: Pick<Messages, "study2.label" | "study2.hint" | "study2.foot" | "study2.frame" | "study2.mosaic">;
}) {
  const mode = useMotionMode();

  const root = useScrollScene(mode === "ring", 5.4, (el) => {
    const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile]"));
    const readout = el.querySelector<HTMLElement>("[data-readout]");
    const mark = el.querySelector<HTMLElement>("[data-mark]");
    const phoneCount = window.innerWidth < 768 ? 96 : TILES;
    const cells = mosaicCells(phoneCount);
    let drag = 0;
    let lastP = 0;
    let step = -1;
    const lock = onceAbove(0.86, () => cue("lock"));
    const dispose = attachDrag(el, (dx) => {
      drag -= dx * 0.3;
      render(lastP);
    });
    const render = (p: number) => {
      lastP = p;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const phone = w < 768;
      const tile = phone ? w * 0.24 : Math.min(w * 0.11, h * 0.2);
      const R = phone ? w * 0.34 : Math.min(w * 0.26, 460);
      const rise = tile * 0.24; // vertical pitch of the helix
      // the camera starts moving at once (no ease-in from rest), so the helix never sits frozen
      const ct = clamp01(p / 0.64);
      const climb = 1 - (1 - ct) ** 1.6;
      const spin = climb * 300 + drag;
      // the first tiles start in the lower third and rise in with the section; then the camera climbs
      // through a full screen of the helix up to the last tile
      const camY = lerp(-h * 0.3, phoneCount * rise - h * 0.45, climb);
      const u = clamp01((p - 0.5) / 0.3);
      // once the mosaic is in place, the crisp wordmark surfaces over it and the photos step back
      const legible = smooth((p - 0.8) / 0.1);
      const k = Math.min((w * 0.86) / WORD.w, (h * 0.34) / WORD.h);
      for (let i = 0; i < TILES; i++) {
        const t = tiles[i];
        if (!t) continue;
        if (i >= phoneCount) {
          t.style.opacity = "0";
          continue;
        }
        const a = ((i * 26 - spin) * Math.PI) / 180;
        const s = Math.sin(a);
        const c = Math.cos(a);
        const hx = s * R;
        const hz = (c - 1) * R;
        const hy = i * rise - camY;
        const cell = cells[i];
        // each tile starts its flight a little later: a wave across the archive
        const ui = smooth(u * 1.6 - (i / TILES) * 0.6);
        const tx = cell ? cell.x * k : hx;
        const ty = cell ? cell.y * k : hy;
        const ts = cell ? (cell.size * k) / tile : 0.01;
        const x = lerp(hx, tx, ui);
        const y = lerp(hy, ty, ui);
        const z = lerp(hz, 0, ui);
        const rot = lerp(-s * 40, 0, ui);
        const sc = lerp(1, ts * 0.94, ui);
        // tiles fade out softly towards the top and bottom edges instead of vanishing at a cut-off
        const edge = clamp01((h * 0.78 - Math.abs(hy)) / (h * 0.22));
        const depth = (c + 1) / 2;
        const base = (0.2 + 0.8 * depth) * edge;
        const op = (cell ? lerp(base, 1, ui) : lerp(base, 0, ui)) * lerp(1, 0.2, legible);
        t.style.transform = `translate(-50%, -50%) perspective(1500px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        t.style.opacity = op.toFixed(3);
        t.style.zIndex = String(Math.round(lerp(depth, 1, ui) * 100));
      }
      const st = Math.floor(spin / 26);
      if (st !== step && u < 0.2) {
        if (step !== -1) cue("tick");
        step = st;
      }
      lock(p);
      if (mark) {
        mark.style.opacity = legible.toFixed(3);
        mark.style.transform = `scale(${lerp(1.04, 1, legible).toFixed(4)})`;
        mark.style.width = `${(WORD.w * k).toFixed(1)}px`;
      }
      if (readout) readout.textContent = u > 0.6 ? t["study2.mosaic"] : `${t["study2.frame"]} ${String((Math.max(0, st) % TILES) + 1).padStart(3, "0")}`;
    };
    return { render, dispose };
  });

  return (
    <section ref={root} id="study-helix" data-section data-theme="dark" className={styles.scene} data-mode={mode} aria-label={t["study2.label"]}>
      <span className={styles.guide} style={{ top: "18%" }} aria-hidden="true" />
      <span className={styles.guide} style={{ top: "86%" }} aria-hidden="true" />
      <p className={`micro ${styles.label}`} aria-hidden="true">{t["study2.label"]}</p>
      <p className={`micro ${styles.labelR}`} aria-hidden="true">
        <span data-readout>{t["study2.frame"]} 001</span>
      </p>
      <p className={`micro ${styles.foot}`} aria-hidden="true">{t["study2.hint"]}</p>
      <p className={`micro ${styles.footR}`} aria-hidden="true">{t["study2.foot"]}</p>
      <div className={styles.stage}>
        {Array.from({ length: TILES }, (_, i) => {
          const id = GALLERY[i % GALLERY.length]!;
          return (
            <div key={i} className={`${styles.item} ${styles.tile} ${styles.helixTile}`} data-tile>
              <Img id={id} alt="" sizes="(max-width: 767px) 24vw, 11vw" draggable={false} />
            </div>
          );
        })}
      </div>
      <div className={`${styles.mark} ${styles.helixMark}`} data-mark>
        <Wordmark label="NØFORM" />
      </div>
    </section>
  );
}
