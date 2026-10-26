"use client";

import { useEffect, useState } from "react";
import { mediaSrc } from "@/components/Img";
import media from "@/lib/media.json";
import { attachDrag, GALLERY, GLYPHS, GLYPH_Y, lerp, onceAbove, smooth, useScrollScene, WORD } from "@/lib/studies";
import { useMotionMode } from "@/lib/useMotionMode";
import { cue } from "@/lib/sound";
import { WORDMARK_PATH } from "@/lib/wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./Studies.module.css";

const PAD = 18;
const N = GLYPHS.length;
const STEP = 360 / N;

/**
 * Study 01 — Letters ring. The six letters of the wordmark stand on a carousel ring, each a window onto
 * a campaign photograph. Scroll turns the ring once (drag adds), then the letters unfold into the wordmark.
 */
export function LettersRing({ t }: { t: Pick<Messages, "study1.label" | "study1.caption" | "study.hintTurn"> }) {
  const mode = useMotionMode();
  const [near, setNear] = useState(false);

  const root = useScrollScene(mode === "ring", 3.2, (el) => {
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-letter]"));
    const photos = Array.from(el.querySelectorAll<SVGImageElement>("[data-photo]"));
    const readout = el.querySelector<HTMLElement>("[data-readout]");
    let drag = 0;
    let front = -1;
    const lock = onceAbove(0.9, () => cue("lock"));
    let lastP = 0;
    const detach = attachDrag(el, (dx) => {
      drag -= dx * 0.25;
      render(lastP);
    });
    const render = (p: number) => {
      lastP = p;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const phone = w < 768;
      const ringH = h * (phone ? 0.2 : 0.3); // matches .ringLetter height (20svh / 30svh)
      const kRing = ringH / WORD.h;
      const kLine = Math.min((w * 0.88) / WORD.w, (h * 0.32) / WORD.h);
      const rx = phone ? w * 0.4 : Math.min(w * 0.38, 700);
      const rz = phone ? 340 : 620;
      const turn = smooth(p / 0.66);
      const u = smooth((p - 0.66) / 0.26);
      const angle = turn * 360 + drag * (1 - u);
      for (let i = 0; i < N; i++) {
        const g = GLYPHS[i]!;
        const el2 = items[i];
        if (!el2) continue;
        const rad = ((i * STEP - angle) * Math.PI) / 180;
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const depth = (c + 1) / 2;
        const ringX = s * rx;
        const ringZ = (c - 1) * rz;
        const lineX = ((g.x0 + g.x1) / 2 - WORD.cx) * kLine;
        const x = lerp(ringX, lineX, u);
        const z = lerp(ringZ, 0, u);
        const rot = lerp(-s * 26, 0, u);
        const scale = lerp(1, kLine / kRing, u);
        const op = lerp(0.25 + 0.75 * depth ** 1.3, 1, u);
        el2.style.transform = `translate(-50%, -50%) perspective(1400px) translate3d(${x.toFixed(1)}px, 0px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        el2.style.opacity = op.toFixed(3);
        el2.style.zIndex = String(Math.round(lerp(depth, 1, u) * 100));
        // the photo slides inside the letter as the ring turns
        photos[i]?.setAttribute("transform", `translate(${(-s * 60 * (1 - u)).toFixed(1)} 0)`);
      }
      const f = Math.round((((angle % 360) + 360) % 360) / STEP) % N;
      if (f !== front && u < 0.5) {
        if (front !== -1) cue("tick");
        front = f;
      }
      if (readout) readout.textContent = u > 0.5 ? "NØFORM" : `${GLYPHS[f]?.ch ?? ""} / 0${f + 1}`;
      const mark = el.querySelector<HTMLElement>("[data-caption]");
      lock(p);
      if (mark) mark.style.opacity = smooth((p - 0.86) / 0.1).toFixed(3);
    };
    return { render, dispose: detach };
  });

  // SVG <image> is never lazy: attach photo sources once the scene is near.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const on = () => setNear(true);
    if (el.dataset.near === "true") on();
    el.addEventListener("scene:near", on, { once: true });
    return () => el.removeEventListener("scene:near", on);
  }, [root]);

  return (
    <section ref={root} id="study-ring" data-section data-theme="dark" className={styles.scene} data-mode={mode} aria-label={t["study1.label"]}>
      <span className={styles.guide} style={{ top: "28%" }} aria-hidden="true" />
      <span className={styles.guide} style={{ top: "76%" }} aria-hidden="true" />
      <p className={`micro ${styles.label}`} aria-hidden="true">{t["study1.label"]}</p>
      <p className={`micro ${styles.labelR}`} aria-hidden="true">
        <span data-readout>N / 01</span>
      </p>
      <p className={`micro ${styles.foot}`} aria-hidden="true">{t["study.hintTurn"]}</p>
      <p className={`micro ${styles.footR}`} data-caption aria-hidden="true" style={{ opacity: 0 }}>
        {t["study1.caption"]}
      </p>

      <div className={styles.stage}>
        {GLYPHS.map((g, i) => {
          const vbX = g.x0 - PAD;
          const vbW = g.x1 - g.x0 + PAD * 2;
          const vbY = GLYPH_Y.top - PAD;
          const vbH = GLYPH_Y.bottom - GLYPH_Y.top + PAD * 2;
          const id = GALLERY[i % GALLERY.length]!;
          const m = media[id];
          // cover the letter box with the photograph (plus room to slide)
          const cover = Math.max((vbW + 160) / m.width, vbH / m.height);
          const iw = m.width * cover;
          const ih = m.height * cover;
          return (
            <div key={g.ch} className={`${styles.item} ${styles.ringLetter}`} data-letter style={{ aspectRatio: `${vbW} / ${vbH}` }}>
              <svg className={styles.letter} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} width="100%" height="100%" aria-hidden="true" focusable="false">
                <defs>
                  <clipPath id={`ring-${i}`}>
                    <path d={WORDMARK_PATH} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#ring-${i})`}>
                  <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="#1c1c1e" />
                  <image
                    data-photo
                    href={near || mode === "list" ? mediaSrc(id, 960) : undefined}
                    x={vbX + vbW / 2 - iw / 2}
                    y={vbY + vbH / 2 - ih * 0.42}
                    width={iw}
                    height={ih}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                <path className={styles.letterOutline} d={WORDMARK_PATH} />
              </svg>
            </div>
          );
        })}
      </div>
    </section>
  );
}
