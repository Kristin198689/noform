"use client";

import { Img } from "@/components/Img";
import { attachDrag, clamp01, GALLERY, lerp, onceAbove, smooth, useScrollScene } from "@/lib/studies";
import { useMotionMode } from "@/lib/useMotionMode";
import { cue } from "@/lib/sound";
import type { Messages } from "@/i18n/messages";
import styles from "./Studies.module.css";

const TILES = 40;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// unit sphere points (fibonacci) and Ø targets (ring + slash), computed once
const SPHERE = Array.from({ length: TILES }, (_, i) => {
  const y = 1 - (i / (TILES - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = GOLDEN * i;
  return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
});
const RING = Math.round(TILES * 0.74);
const OSLASH = Array.from({ length: TILES }, (_, i) => {
  if (i < RING) {
    const a = (i / RING) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 0.8, y: Math.sin(a) * 1, rot: (a * 180) / Math.PI + 90 };
  }
  const t = (i - RING) / (TILES - RING - 1) - 0.5;
  return { x: t * 1.5, y: -t * 2.3, rot: -57 };
});

/**
 * Study 03 — Sphere of looks. Campaign tiles on a 3D sphere: scroll turns it, drag spins it,
 * near tiles are large and bright, far ones small and dim; the sphere then collapses into Ø.
 */
export function SphereLooks({
  t,
}: {
  t: Pick<Messages, "study3.label" | "study3.foot" | "study3.yaw" | "study3.collapsed" | "study.hintTurn">;
}) {
  const mode = useMotionMode();

  const root = useScrollScene(mode === "ring", 3.2, (el) => {
    const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile]"));
    const readout = el.querySelector<HTMLElement>("[data-readout]");
    let yawDrag = 0;
    let lastP = 0;
    let step = -1;
    const lock = onceAbove(0.9, () => cue("lock"));
    const dispose = attachDrag(el, (dx) => {
      yawDrag += dx * 0.006;
      render(lastP);
    });
    const render = (p: number) => {
      lastP = p;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const phone = w < 768;
      const R = phone ? Math.min(w * 0.4, h * 0.3) : Math.min(w * 0.22, h * 0.34);
      const turn = smooth(p / 0.62);
      const u = smooth(clamp01((p - 0.62) / 0.3));
      const yaw = turn * Math.PI * 2 + yawDrag * (1 - u);
      const pitch = Math.sin(turn * Math.PI) * 0.45;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const oR = phone ? Math.min(w * 0.36, h * 0.24) : Math.min(w * 0.18, h * 0.3);
      for (let i = 0; i < TILES; i++) {
        const t = tiles[i];
        const s0 = SPHERE[i]!;
        const o = OSLASH[i]!;
        if (!t) continue;
        // rotate around Y (yaw) then X (pitch)
        const x1 = s0.x * cy + s0.z * sy;
        const z1 = -s0.x * sy + s0.z * cy;
        const y2 = s0.y * cp - z1 * sp;
        const z2 = s0.y * sp + z1 * cp;
        const depth = (z2 + 1) / 2;
        const sx = x1 * R;
        const syy = y2 * R;
        const sz = (z2 - 1) * R * 1.2;
        const ui = smooth(u * 1.5 - (i / TILES) * 0.5);
        const x = lerp(sx, o.x * oR, ui);
        const y = lerp(syy, o.y * oR, ui);
        const z = lerp(sz, 0, ui);
        const rot = lerp(x1 * 30, o.rot, ui);
        const sc = lerp(0.55 + depth * 0.55, 0.62, ui);
        t.style.transform = `translate(-50%, -50%) perspective(1400px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${(ui * rot).toFixed(1)}deg) rotateY(${((1 - ui) * -x1 * 32).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        t.style.opacity = lerp(0.15 + depth * 0.85, 1, ui).toFixed(3);
        t.style.zIndex = String(Math.round(lerp(depth, 1, ui) * 100));
      }
      lock(p);
      const st = Math.floor((yaw * 180) / Math.PI / 30);
      if (st !== step && u < 0.2) {
        if (step !== -1) cue("tick");
        step = st;
      }
      if (readout) readout.textContent = u > 0.6 ? t["study3.collapsed"] : `${t["study3.yaw"]} ${String(Math.round(((yaw * 180) / Math.PI) % 360)).padStart(3, "0")}°`;
    };
    return { render, dispose };
  });

  return (
    <section ref={root} id="study-sphere" data-section data-theme="dark" className={styles.scene} data-mode={mode} aria-label={t["study3.label"]}>
      <span className={styles.guide} style={{ top: "50%", opacity: 0.6 }} aria-hidden="true" />
      <p className={`micro ${styles.label}`} aria-hidden="true">{t["study3.label"]}</p>
      <p className={`micro ${styles.labelR}`} aria-hidden="true">
        <span data-readout>{t["study3.yaw"]} 000°</span>
      </p>
      <p className={`micro ${styles.foot}`} aria-hidden="true">{t["study.hintTurn"]}</p>
      <p className={`micro ${styles.footR}`} aria-hidden="true">{t["study3.foot"]}</p>
      <div className={styles.stage}>
        {Array.from({ length: TILES }, (_, i) => (
          <div key={i} className={`${styles.item} ${styles.tile} ${styles.sphereTile}`} data-tile>
            <Img id={GALLERY[(i * 3) % GALLERY.length]!} alt="" sizes="(max-width: 767px) 22vw, 9vw" draggable={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
