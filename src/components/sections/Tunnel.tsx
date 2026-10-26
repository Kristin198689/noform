"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { ambient } from "@/lib/sound";
import { useMotionMode } from "@/lib/useMotionMode";
import { WORDMARK_PATH } from "@/lib/wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./Tunnel.module.css";

type Strings = Pick<Messages, "tunnel.title">;

// The Ø of the approved wordmark (path space): centre and size of the glyph box.
const O = { cx: 1228, cy: 600, w: 750, h: 727 };
const RINGS = 10;
const GAP = 1; // depth between rings (focal units)
const FOCAL = 1;
const START = -0.9; // camera before the first ring
const END = RINGS * GAP; // the far end of the corridor, where the closing phrase waits
const BASE = 760 / O.h; // a ring at the focal plane is ~76% of the frame height
const PINK = 6;

/**
 * Inside the form — a camera flight through Ø contours set at increasing depth.
 * Real perspective (scale = focal / distance), so near contours accelerate and leave the frame
 * while far ones approach; a corridor of frames and vanishing lines carries the depth.
 * The closing phrase sits at the far end and approaches with the same perspective; the last contours
 * sweep past the edges and the scanner's letters draw in right after. Uniform speed, no idle ends.
 */
export function Tunnel({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current) return;
      const q = gsap.utils.selector(root);
      const rings = q<SVGGElement>("[data-ring]");
      const frames = q<SVGRectElement>("[data-frame]");
      const depth = root.current.querySelector<HTMLElement>("[data-depth]");
      const zRead = root.current.querySelector<HTMLElement>("[data-z]");
      const text = root.current.querySelector<HTMLElement>("[data-title]");
      const state = { cam: START, vx: 0, vy: 0 };
      let passed = -1;

      const render = () => {
        let count = 0;
        for (let i = 0; i < RINGS; i++) {
          const rel = i * GAP - state.cam;
          const g = rings[i];
          const f = frames[i];
          if (!g || !f) continue;
          if (rel <= -0.82) {
            g.style.opacity = "0";
            f.style.opacity = "0";
            count++;
            continue;
          }
          const s = FOCAL / (FOCAL + rel);
          const k = BASE * s;
          // near contours fade as they sweep past the edges; far ones emerge from the dark
          const near = gsap.utils.clamp(0, 1, (5.4 - s) / 2.4);
          const far = gsap.utils.clamp(0, 1, (RINGS * GAP - rel) / 3.2);
          const o = Math.min(near, far);
          const px = state.vx * (1 - s * 0.35);
          const py = state.vy * (1 - s * 0.35);
          const rot = i * 11 + state.cam * 6;
          g.setAttribute(
            "transform",
            `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${k.toFixed(4)}) translate(${-O.cx} ${-O.cy})`,
          );
          g.style.opacity = o.toFixed(3);
          const fw = 1200 * s;
          const fh = 820 * s;
          f.setAttribute("x", (px - fw / 2).toFixed(1));
          f.setAttribute("y", (py - fh / 2).toFixed(1));
          f.setAttribute("width", fw.toFixed(1));
          f.setAttribute("height", fh.toFixed(1));
          f.style.opacity = (o * 0.5).toFixed(3);
          if (rel < 0) count++;
        }
        if (count !== passed) {
          passed = count;
          if (depth) depth.textContent = String(Math.min(RINGS, count + 1)).padStart(2, "0");
        }
        if (zRead) zRead.textContent = `Z ${((state.cam - START) / (END - START)).toFixed(2)}`;
        if (text) {
          // the phrase keeps the vanishing point's lean
          gsap.set(text, { x: state.vx * 0.4, y: state.vy * 0.4 });
        }
      };

      if (text) gsap.set(text, { yPercent: -50 });
      render();

      // Phases (one scrubbed timeline, no idle scroll):
      // 0–0.62 flight · 0.5–0.72 the phrase approaches from depth · 0.72–0.9 it holds, fully readable
      // · 0.9–1 it opens past the camera while the scanner below is already drawing its letters.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 6}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => ambient(0.25 + Math.sin(Math.min(1, self.progress / 0.9) * Math.PI) * 0.75),
            onLeave: () => ambient(null),
            onLeaveBack: () => ambient(null),
          },
        })
        .to(state, { cam: END - 0.4, duration: 0.62, ease: "none", onUpdate: render }, 0)
        .to(state, { cam: END + 1.2, duration: 0.38, ease: "power1.in", onUpdate: render }, 0.62)
        .fromTo(q("[data-vanish]"), { opacity: 0.15 }, { opacity: 0.5, duration: 0.25 }, 0)
        .to(q("[data-vanish]"), { opacity: 0, duration: 0.15 }, 0.62)
        .to(q("[data-centre]"), { opacity: 0, duration: 0.08 }, 0.6)
        .fromTo(q("[data-title]"), { scale: 0.08, opacity: 0 }, { scale: 0.35, opacity: 1, duration: 0.22, ease: "none" }, 0.5)
        .to(q("[data-title]"), { scale: 1, duration: 0.12, ease: "power2.out" }, 0.72 - 0.12)
        // hold: fully visible and still from 0.72 to 0.9
        .to(q("[data-title]"), { scale: 4.5, opacity: 0, duration: 0.1, ease: "power2.in" }, 0.9);

      // Entering from above: the corridor lines draw in while the section arrives.
      gsap.fromTo(
        q("[data-vanish]"),
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          stagger: 0.03,
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: 0.6 },
        },
      );

      // Desktop: the vanishing point leans gently towards the cursor.
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
        const el = root.current;
        if (!el) return;
        const onMove = (e: PointerEvent) => {
          gsap.to(state, {
            vx: (e.clientX / window.innerWidth - 0.5) * 120,
            vy: (e.clientY / window.innerHeight - 0.5) * 80,
            duration: 1.1,
            ease: "power3.out",
            overwrite: "auto",
            onUpdate: render,
          });
        };
        el.addEventListener("pointermove", onMove);
        return () => el.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [mode], revertOnUpdate: true },
  );

  // Static composition for reduced motion / no JS: nested contours, both phrases readable.
  const staticScales = [1.05, 0.7, 0.47, 0.31, 0.2, 0.13];

  return (
    <section id="inside" data-section ref={root} className={styles.tunnel} data-mode={mode} aria-labelledby="inside-title">
      <svg className={styles.svg} viewBox="-800 -500 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="tunnel-o" clipPathUnits="userSpaceOnUse">
            {/* horizontally tight to Ø (neighbours are ~70 units away), vertically generous for the slash */}
            <rect x={O.cx - O.w / 2 - 30} y={O.cy - O.h / 2 - 160} width={O.w + 60} height={O.h + 320} />
          </clipPath>
          <path id="tunnel-glyph" d={WORDMARK_PATH} />
        </defs>
        {[
          [-800, -500],
          [800, -500],
          [-800, 500],
          [800, 500],
          [0, -500],
          [0, 500],
          [-800, 0],
          [800, 0],
        ].map(([x, y]) => (
          <line key={`${x}${y}`} className={styles.vanish} data-vanish x1={x} y1={y} x2="0" y2="0" pathLength={1} strokeDasharray="1" />
        ))}
        {Array.from({ length: RINGS }, (_, i) => (
          <rect key={`f${i}`} data-frame className={styles.frame} x="0" y="0" width="0" height="0" />
        ))}
        {Array.from({ length: RINGS }, (_, i) => {
          const s = staticScales[i] ?? 0;
          return (
            <g
              key={i}
              data-ring
              className={i === PINK ? styles.ringPink : styles.ring}
              transform={mode === "list" ? `rotate(${i * 11}) scale(${BASE * s}) translate(${-O.cx} ${-O.cy})` : undefined}
              style={mode === "list" && !s ? { opacity: 0 } : undefined}
            >
              <use href="#tunnel-glyph" clipPath="url(#tunnel-o)" />
            </g>
          );
        })}
        <path className={styles.center} data-centre d="M-10 0 H10 M0 -10 V10" />
      </svg>

      <p className={`micro ${styles.tl}`} aria-hidden="true">
        Ø / CORRIDOR STUDY
      </p>
      <p className={`micro ${styles.tr}`} aria-hidden="true">
        DEPTH <span className="pink" data-depth>01</span> / {String(RINGS).padStart(2, "0")}
      </p>
      <p className={`micro ${styles.bl}`} aria-hidden="true">
        <span data-z>Z 0.00</span>
      </p>
      <p className={`micro ${styles.br}`} aria-hidden="true">
        FRONT VIEW / CONTINUOUS CURVE
      </p>

      <h2 id="inside-title" className={`display ${styles.title}`} data-title>
        {t["tunnel.title"]}
      </h2>
    </section>
  );
}
