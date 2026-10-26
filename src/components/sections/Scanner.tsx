"use client";

import { useEffect, useRef, useState } from "react";
import { mediaSrc, type MediaId } from "@/components/Img";
import media from "@/lib/media.json";
import { gsap, refreshInOrder, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cue } from "@/lib/sound";
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
  // SVG <image> cannot be lazy: only attach sources when the scene is close (see ScenePreloader).
  const [near, setNear] = useState(false);
  const [fillWidth, setFillWidth] = useState(960);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onNear = () => {
      setFillWidth(window.innerWidth < 768 ? 480 : 960);
      setNear(true);
    };
    if (el.dataset.near === "true") onNear();
    el.addEventListener("scene:near", onNear, { once: true });
    return () => el.removeEventListener("scene:near", onNear);
  }, []);
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
      requestAnimationFrame(() => refreshInOrder());
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
      const frame = root.current.querySelector<HTMLElement>("[data-frame]");
      if (!line || !block || !frame) return;

      // a soft pass each time the line enters a word (both directions, never per pixel)
      const inside: boolean[] = [];
      const apply = (p: number) => {
        // Desktop: the words fill the frame, the line sweeps them. Phones: the words are a band,
        // so the line crosses the whole frame (grid, coordinates, words) and nothing sits idle.
        const frameRect = frame.getBoundingClientRect();
        const blockRect = block.getBoundingClientRect();
        const phone = window.innerWidth < 768;
        const lineY = phone ? frameRect.top + p * frameRect.height : blockRect.top + p * blockRect.height;
        line.style.transform = `translateY(${(lineY - frameRect.top).toFixed(1)}px)`;
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
          const within = h > 0 && h < box.h + PAD * 2;
          if (within && !inside[i] && mode !== "list") cue("sweep");
          inside[i] = within;
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
      gsap.fromTo(
        root.current.querySelectorAll("[data-outline]"),
        { strokeDasharray: "0 6000" },
        {
          strokeDasharray: "6000 0",
          ease: "none",
          stagger: 0.12,
          // drawn by the scroll as the section rises in right after the tunnel
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: 0.6 },
        },
      );
      wordEls.forEach((svg, i) =>
        gsap.fromTo(
          svg,
          { xPercent: i % 2 ? 3 : -3 },
          {
            xPercent: i % 2 ? -3 : 3,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 1.2}`, scrub: true },
          },
        ),
      );
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
      // this pin may be rebuilt after the glyph boxes are measured: re-measure everything below it
      requestAnimationFrame(refreshInOrder);
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
      <div className={styles.frame} data-frame>
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
                      href={near ? mediaSrc(fill.media, fillWidth) : undefined}
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
                  data-outline
                  fontSize={FONT_SIZE}
                >
                  {word}
                </text>
              </svg>
            );
          })}
        </div>

        <span className={styles.scanline} data-scanline aria-hidden="true">
          <span className={styles.scanTarget} />
          <span className={`deco ${styles.scanY}`} data-no-auto>
            Y / SCAN
          </span>
        </span>

        <div className={styles.foot}>
          <p className={styles.statement} data-split>
            {t["scanner.statement"]}
          </p>
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
