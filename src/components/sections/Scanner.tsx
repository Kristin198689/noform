"use client";

import { useEffect, useRef, useState } from "react";
import { mediaSrc, type MediaId } from "@/components/Img";
import media from "@/lib/media.json";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/useMotionMode";
import type { Messages } from "@/i18n/messages";
import styles from "./Scanner.module.css";

type Strings = Pick<
  Messages,
  "scanner.title" | "scanner.word1" | "scanner.word2" | "scanner.word3" | "scanner.statement" | "scanner.scan"
>;

type Box = { x: number; y: number; w: number; h: number };

// Fragments of our own photographs, seen only through the letterforms.
const FILLS: { media: MediaId; scale: number; focus: [number, number] }[] = [
  { media: "look-04", scale: 2.1, focus: [0.6, 0.3] }, // VOLUME — hoodie folds and silhouette
  { media: "visor-front", scale: 1.3, focus: [0.5, 0.36] }, // CURVE — mirrored visor and face
  { media: "look-01", scale: 1.35, focus: [0.42, 0.62] }, // TEXTURE — washed cargo denim
];

const FONT_SIZE = 100;
const PAD = 6;

function estimate(word: string): Box {
  return { x: 0, y: -FONT_SIZE * 0.735, w: Math.max(1, word.length) * 76, h: FONT_SIZE * 0.77 };
}

function imageRect(box: Box, fill: (typeof FILLS)[number]) {
  const m = media[fill.media];
  const w = box.w * fill.scale;
  const h = (w * m.height) / m.width;
  const cover = Math.max(1, (box.h + PAD * 2) / h);
  const W = w * cover;
  const H = h * cover;
  return {
    x: box.x + box.w / 2 - fill.focus[0] * W,
    y: box.y + box.h / 2 - fill.focus[1] * H,
    w: W,
    h: H,
  };
}

export function Scanner({ t, locale }: { t: Strings; locale: string }) {
  const root = useRef<HTMLElement>(null);
  const words = [t["scanner.word1"], t["scanner.word2"], t["scanner.word3"]];
  const [boxes, setBoxes] = useState<Box[]>(() => words.map(estimate));
  const measureRefs = useRef<(SVGTextElement | null)[]>([]);
  const mode = useMotionMode();
  const percent = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLSpanElement>(null);

  // Fit each SVG to the real glyph box once the local fonts are ready (lengths differ per language).
  useEffect(() => {
    let alive = true;
    void document.fonts.ready.then(() => {
      if (!alive) return;
      const next = measureRefs.current.map((el, i) => {
        if (!el) return estimate(words[i] ?? "");
        // Both display faces have a 0.70 cap height; keep a little room for overshoot.
        const b = el.getBBox();
        return { x: b.x - 2, y: -FONT_SIZE * 0.735, w: b.width + 4, h: FONT_SIZE * 0.77 };
      });
      setBoxes(next);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- words come from the locale
  }, [locale]);

  useGSAP(
    () => {
      if (!root.current) return;
      const wordEls = gsap.utils.toArray<SVGSVGElement>("[data-word]");
      const line = root.current.querySelector<HTMLElement>("[data-scanline]");
      const block = root.current.querySelector<HTMLElement>("[data-words]");
      if (!line || !block) return;

      const apply = (p: number) => {
        const blockRect = block.getBoundingClientRect();
        const lineY = blockRect.top + p * blockRect.height;
        line.style.transform = `translateY(${(p * blockRect.height).toFixed(1)}px)`;
        wordEls.forEach((svg, i) => {
          const box = boxes[i];
          if (!box) return;
          const r = svg.getBoundingClientRect();
          const vbH = box.h + PAD * 2;
          const scale = Math.min(r.width / box.w, r.height / vbH) || 1;
          const offsetY = (r.height - vbH * scale) / 2;
          const local = (lineY - r.top - offsetY) / scale + (box.y - PAD);
          const top = box.y - PAD;
          const h = Math.max(0, Math.min(box.h + PAD * 2, local - top));
          svg.querySelector("[data-scan-rect]")?.setAttribute("height", h.toFixed(2));
          svg.querySelector("[data-flash]")?.setAttribute("y", (local - 1.6).toFixed(2));
          svg.querySelector("[data-photo]")?.setAttribute("transform", `translate(0 ${(-p * 6).toFixed(2)})`);
        });
        const pct = Math.round(p * 100);
        if (percent.current) percent.current.textContent = String(pct).padStart(3, "0");
        if (meter.current) meter.current.style.transform = `scaleX(${p.toFixed(3)})`;
      };

      if (mode === "list") {
        apply(1);
        return;
      }

      apply(0);
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: () => `+=${window.innerHeight * 1.6}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(gsap.utils.clamp(0, 1, self.progress * 1.12 - 0.04)),
        onRefresh: (self) => apply(gsap.utils.clamp(0, 1, self.progress * 1.12 - 0.04)),
      });
    },
    { scope: root, dependencies: [boxes, mode], revertOnUpdate: true },
  );

  const scanned = mode === "list";

  return (
    <section
      id="scanner"
      data-section
      ref={root}
      className={styles.scanner}
      data-mode={mode}
      aria-labelledby="scanner-title"
    >
      <div className={styles.frame}>
        <div className={styles.grid} aria-hidden="true" />
        <span className="cross" style={{ left: "var(--gutter)", top: "12%" }} aria-hidden="true" />
        <span className="cross" style={{ left: "50%", top: "8%" }} aria-hidden="true" />
        <span className="cross" style={{ left: "calc(100% - var(--gutter))", top: "12%" }} aria-hidden="true" />
        <span className="cross" style={{ left: "var(--gutter)", top: "86%" }} aria-hidden="true" />
        <span className="cross" style={{ left: "50%", top: "88%" }} aria-hidden="true" />
        <span className="cross" style={{ left: "calc(100% - var(--gutter))", top: "86%" }} aria-hidden="true" />

        <h2 id="scanner-title" className={`micro ${styles.title}`}>
          06 / {t["scanner.title"]}
        </h2>

        <div className={styles.words} data-words>
          <p className="sr-only">{words.join(" / ")}</p>
          {words.map((word, i) => {
            const box = boxes[i] ?? estimate(word);
            const fill = FILLS[i] ?? FILLS[0]!;
            const img = imageRect(box, fill);
            const id = `scan-${i}`;
            const vb = `${box.x} ${box.y - PAD} ${box.w} ${box.h + PAD * 2}`;
            return (
              <svg
                key={`${locale}-${word}`}
                className={styles.word}
                viewBox={vb}
                data-word
                aria-hidden="true"
                focusable="false"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <clipPath id={`${id}-text`}>
                    <text x="0" y="0" className={styles.glyphs} fontSize={FONT_SIZE}>
                      {word}
                    </text>
                  </clipPath>
                  <clipPath id={`${id}-scan`}>
                    <rect
                      data-scan-rect
                      x={box.x - 10}
                      y={box.y - PAD}
                      width={box.w + 20}
                      height={scanned ? box.h + PAD * 2 : 0}
                    />
                  </clipPath>
                </defs>
                {/* photograph only inside the letterforms, and only where the line has passed */}
                <g clipPath={`url(#${id}-text)`}>
                  <g clipPath={`url(#${id}-scan)`}>
                    <image
                      data-photo
                      href={mediaSrc(fill.media, 960)}
                      x={img.x}
                      y={img.y}
                      width={img.w}
                      height={img.h}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  {!scanned && <rect data-flash className={styles.flash} x={box.x - 10} y={box.y - 20} width={box.w + 20} height="3.2" />}
                </g>
                <text
                  ref={(el) => {
                    measureRefs.current[i] = el;
                  }}
                  x="0"
                  y="0"
                  className={`${styles.glyphs} ${styles.outline}`}
                  fontSize={FONT_SIZE}
                >
                  {word}
                </text>
              </svg>
            );
          })}
          <span className={styles.scanline} data-scanline aria-hidden="true">
            <span className={styles.scanTarget} />
          </span>
        </div>

        <div className={styles.foot}>
          <p className={styles.statement}>{t["scanner.statement"]}</p>
          <p className={`micro ${styles.codes}`} aria-hidden="true">
            <span>{t["scanner.scan"]}</span>
            <span>SURFACE 001</span>
            <span>FRAME 006</span>
            <span>{words.join(" / ")}</span>
          </p>
          <p className={`micro ${styles.meterWrap}`} aria-hidden="true">
            SCAN / <span ref={percent}>{scanned ? "100" : "000"}</span>%
            <span className={styles.meter}>
              <span ref={meter} className={styles.meterFill} style={{ transform: `scaleX(${scanned ? 1 : 0})` }} />
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
