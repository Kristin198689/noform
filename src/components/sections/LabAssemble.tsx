"use client";

import { useRef } from "react";
import { Img, type MediaId } from "@/components/Img";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cue } from "@/lib/sound";
import { GALLERY } from "@/lib/studies";
import { useMotionMode } from "@/lib/useMotionMode";
import styles from "./LabAssemble.module.css";

// TODO(asset): replace with a visor PNG shot from below in 3/4, matching the hoodie and cargo camera.
const VISOR: MediaId = "visor-02";

type Vec = [number, number, number, number, number]; // x%, y% of stage, rotation, scale, opacity

type Part = {
  key: "hoodie" | "cargo" | "visor";
  media: MediaId;
  label: string;
  /** assembled box on the 1100 × 1500 stage, in % */
  box: { left: number; top: number; width: number };
  /** arriving from nowhere (deep and small) and leaving to nowhere (past the viewer) */
  from: Vec;
  to: Vec;
};

const PARTS: Part[] = [
  {
    key: "cargo",
    media: "cargo",
    label: "02 / STRUCTURE",
    box: { left: 21.15, top: 42.87, width: 51.73 }, // fly centred under the hoodie front; whole trousers visible
    from: [34, 40, 10, 0.12, 0],
    to: [70, 60, -12, 2.6, 0],
  },
  {
    key: "hoodie",
    media: "hoodie",
    label: "01 / VOLUME",
    box: { left: 27.82, top: 2.27, width: 42.55 }, // hem ends ~24 stage units above the waistband
    from: [-38, -36, -12, 0.12, 0],
    to: [-80, -55, 14, 2.8, 0],
  },
  {
    key: "visor",
    media: VISOR,
    label: "03 / PERSPECTIVE",
    box: { left: 47.18, top: 8.67, width: 13.64 }, // inside the hood opening
    from: [46, -30, 18, 0.1, 0],
    to: [90, -70, 20, 4, 0],
  },
];

// Ø made of campaign tiles: ring + slash, positions in units of the Ø radius
const O_TILES = 30;
const O_RING = 22;
const O_POINTS = Array.from({ length: O_TILES }, (_, i) => {
  if (i < O_RING) {
    const a = (i / O_RING) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 0.82, y: Math.sin(a), rot: (a * 180) / Math.PI + 90 };
  }
  const t = (i - O_RING) / (O_TILES - O_RING - 1) - 0.5;
  return { x: t * 1.5, y: -t * 2.3, rot: -57 };
});
// where each tile comes from: scattered around, deterministic
const O_FROM = O_POINTS.map((_, i) => {
  const a = i * 2.39996; // golden angle
  const r = 2.4 + (i % 5) * 0.35;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, rot: (i * 47) % 90 - 45 };
});

/**
 * Assemble your form. A wall of campaign tiles fills the screen and implodes into a point; out of it the
 * pieces burst and close into the silhouette of an invisible wearer, hold with the phrase, then leave to
 * nowhere (past the viewer, beyond the edges); the same tiles return as a Ø in the emptied centre. One scrubbed timeline, pinned for a fixed length.
 */
export function LabAssemble({ phrase }: { phrase: string }) {
  const root = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current) return;
      const q = gsap.utils.selector(root);
      const stage = root.current.querySelector<HTMLElement>("[data-stage]");
      const oLayer = root.current.querySelector<HTMLElement>("[data-o]");
      if (!stage || !oLayer) return;
      const sx = (v: number) => () => (stage.offsetWidth * v) / 100;
      const sy = (v: number) => () => (stage.offsetHeight * v) / 100;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 3.8}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. The opening: a wall of campaign tiles fills the screen edge to edge, then implodes into the centre.
      const tiles = q("[data-otile]");
      const wall = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const phone = w < 768;
        const cols = phone ? 5 : 8;
        const rows = phone ? 6 : 4;
        const th = phone ? h / 6.2 : h / 3.6;
        const tw = th * 0.75;
        const base = tiles[0]?.offsetWidth || 1;
        // phones fill all 30 cells; the 8 × 4 desktop wall leaves its two outer corners empty
        const slots = Array.from({ length: cols * rows }, (_, k) => k).filter((k) => phone || (k !== 0 && k !== cols * rows - 1));
        return { cols, rows, sx: tw + 8, sy: th + 8, scale: tw / base, slots };
      };
      const cell = (i: number) => {
        const g = wall();
        const k = g.slots[i] ?? 0;
        return { x: ((k % g.cols) - (g.cols - 1) / 2) * g.sx, y: (Math.floor(k / g.cols) - (g.rows - 1) / 2) * g.sy, scale: g.scale };
      };
      tiles.forEach((t, i) => {
        const d = Math.hypot(O_FROM[i]!.x, O_FROM[i]!.y);
        tl.fromTo(
          t,
          { x: () => cell(i).x, y: () => cell(i).y, scale: () => cell(i).scale, rotation: 0, opacity: 1 },
          { x: 0, y: 0, scale: 0.04, rotation: (i % 2 ? 1 : -1) * (120 + (i % 5) * 30), opacity: 0, duration: 0.11, ease: "power3.in" },
          0.03 + (d - 2.4) * 0.012 + (i % 6) * 0.004,
        );
      });
      tl.add(() => cue("pulse"), 0.15)
        .fromTo(q("[data-burst]"), { scale: 0, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 0.08, ease: "power2.out", immediateRender: false }, 0.15);

      // 2. Out of that point the pieces burst and close into the silhouette.
      PARTS.forEach((p, i) => {
        const el = q(`[data-part="${p.key}"]`)[0];
        if (!el) return;
        const [, , fr] = p.from;
        const [tx, ty, tr, ts, to] = p.to;
        const toCentreX = () => stage.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
        const toCentreY = () => stage.offsetHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
        tl.fromTo(el, { x: toCentreX, y: toCentreY, rotation: fr * 2, scale: 0.05, opacity: 0 }, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.2, ease: "power3.out" }, 0.15 + i * 0.03)
          // 4. leave to nowhere: towards the viewer and past the edges
          .to(el, { x: sx(tx), y: sy(ty), rotation: tr, scale: ts, opacity: to, duration: 0.14, ease: "power2.in" }, 0.6 + i * 0.02);
      });

      // 3. Hold: snap, labels and the phrase
      tl.add(() => cue("snap"), 0.38)
        .fromTo(q("[data-snap]"), { scale: 0.6, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.08, ease: "power2.out", immediateRender: false }, 0.37)
        .fromTo(q("[data-shadow]"), { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 0.55, duration: 0.18 }, 0.2)
        .to(q("[data-shadow]"), { scaleX: 0.2, opacity: 0, duration: 0.1 }, 0.6)
        .fromTo(q("[data-part-label]"), { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.02 }, 0.39)
        .to(q("[data-part-label]"), { opacity: 0, duration: 0.04 }, 0.57)
        .fromTo(q("[data-word]"), { yPercent: 110 }, { yPercent: 0, duration: 0.08, stagger: 0.03, ease: "power3.out" }, 0.41)
        .to(q("[data-word]"), { yPercent: -110, duration: 0.06, stagger: 0.02, ease: "power2.in" }, 0.56)
        .fromTo(q("[data-guide]"), { scaleX: 0 }, { scaleX: 1, duration: 0.3 }, 0.15);

      // 5. The same tiles return and gather into a Ø in the emptied centre
      const R = () => Math.min(stage.offsetHeight * 0.3, window.innerWidth * 0.34);
      tiles.forEach((t, i) => {
        const f = O_FROM[i]!;
        const o = O_POINTS[i]!;
        tl.fromTo(
          t,
          { x: () => f.x * R(), y: () => f.y * R(), rotation: f.rot, scale: 0.2, opacity: 0 },
          { x: () => o.x * R(), y: () => o.y * R(), rotation: o.rot, scale: 1, opacity: 1, duration: 0.16, ease: "power3.out", immediateRender: false },
          0.72 + (i / O_TILES) * 0.1,
        );
      });
      tl.fromTo(q("[data-o-caption]"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.92);

      // decorative float on inner layers while the scene is on screen
      const bobs = q("[data-bob]").map((b, i) =>
        gsap.to(b, { y: i % 2 ? 8 : -10, rotation: i % 2 ? -1 : 1, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }),
      );
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * 5}`,
        onToggle: (self) => bobs.forEach((b) => (self.isActive ? b.play() : b.pause())),
      });
      return () => bobs.forEach((b) => b.kill());
    },
    { scope: root, dependencies: [mode], revertOnUpdate: true },
  );

  const words = phrase.match(/[^.]+\.?/g)?.map((w) => w.trim()) ?? [phrase];

  return (
    <div ref={root} className={styles.assemble} data-mode={mode} data-theme="light">
      <span className={styles.guide} style={{ top: "22%" }} data-guide aria-hidden="true" />
      <span className={styles.guide} style={{ top: "82%" }} data-guide aria-hidden="true" />
      <span className={styles.axis} aria-hidden="true" />
      <p className={`micro ${styles.code}`} aria-hidden="true">
        07 / ASSEMBLE YOUR FORM
      </p>
      <p className={`micro ${styles.codeR}`} aria-hidden="true">
        SILHOUETTE / INVISIBLE WEARER
      </p>

      <div className={styles.stage} data-stage>
        <div className={styles.shadow} data-shadow aria-hidden="true" />
        <span className={styles.snap} data-snap aria-hidden="true" />
        {PARTS.map((p) => (
          <span key={`l-${p.key}`} className={`micro ${styles.partLabel}`} data-part-label data-for={p.key} aria-hidden="true">
            {p.label}
          </span>
        ))}
        {PARTS.map((p) => (
          <div
            key={p.key}
            className={styles.part}
            data-part={p.key}
            style={{ left: `${p.box.left}%`, top: `${p.box.top}%`, width: `${p.box.width}%` }}
          >
            <div data-bob>
              <Img id={p.media} alt="" sizes="(max-width: 767px) 60vw, 34vw" draggable={false} />
            </div>
          </div>
        ))}
      </div>

      <span className={styles.burst} data-burst aria-hidden="true" />
      <div className={styles.oLayer} data-o aria-hidden="true">
        {Array.from({ length: O_TILES }, (_, i) => (
          <div key={i} className={styles.oTile} data-otile>
            <Img id={GALLERY[(i * 3) % GALLERY.length]!} alt="" sizes="(max-width: 767px) 18vw, 7vw" draggable={false} />
          </div>
        ))}
      </div>
      <p className={`micro ${styles.oCaption}`} data-o-caption aria-hidden="true">
        Ø / YOUR FORM
      </p>

      <p className={`display ${styles.phrase}`} data-phrase>
        {words.map((w) => (
          <span key={w} className={styles.mask}>
            <span data-word>{w}</span>
          </span>
        ))}
      </p>
    </div>
  );
}
