"use client";

import { useRef } from "react";
import { Img, type MediaId } from "@/components/Img";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cue } from "@/lib/sound";
import { useMotionMode } from "@/lib/useMotionMode";
import styles from "./LabAssemble.module.css";

// TODO(asset): replace with a visor PNG shot from below in 3/4, matching the hoodie and cargo camera.
const VISOR: MediaId = "visor-02";

type Part = {
  key: "hoodie" | "cargo" | "visor";
  media: MediaId;
  label: string;
  /** assembled box on the 1100 × 1500 stage, in % */
  box: { left: number; top: number; width: number };
  /** disassembled offset as % of the stage size, rotation and scale; separate values for phones */
  apart: { desktop: [number, number, number, number]; phone: [number, number, number, number] };
};

const PARTS: Part[] = [
  {
    key: "cargo",
    media: "cargo",
    label: "02 / STRUCTURE",
    box: { left: 21.15, top: 42.87, width: 51.73 }, // fly centred under the hoodie front (pocket centre); whole trousers visible
    apart: { desktop: [46, 12, 7, 0.88], phone: [18, 16, 6, 0.8] },
  },
  {
    key: "hoodie",
    media: "hoodie",
    label: "01 / VOLUME",
    box: { left: 27.82, top: 2.27, width: 42.55 }, // hem ends ~24 stage units above the waistband
    apart: { desktop: [-44, -10, -8, 0.9], phone: [-16, -14, -7, 0.82] },
  },
  {
    key: "visor",
    media: VISOR,
    label: "03 / PERSPECTIVE",
    box: { left: 47.18, top: 8.67, width: 13.64 }, // inside the hood opening
    apart: { desktop: [28, -26, 6, 2.1], phone: [10, -30, 5, 1.7] },
  },
];

/**
 * Assemble your form: hoodie, cargo and visor drift apart, converge on different paths into the
 * silhouette of an invisible wearer, hold for a moment with the phrase, then part again for the finale.
 * One scrubbed timeline; only translate / scale / small in-plane tilts — no flat image turns sideways.
 */
export function LabAssemble({ phrase }: { phrase: string }) {
  const root = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current) return;
      const q = gsap.utils.selector(root);
      const phone = window.innerWidth < 768;
      const stage = root.current.querySelector<HTMLElement>("[data-stage]");
      if (!stage) return;

      const apartOf = (p: Part) => {
        const [x, y, r, s] = phone ? p.apart.phone : p.apart.desktop;
        return { xPercent: 0, x: () => (stage.offsetWidth * x) / 100, y: () => (stage.offsetHeight * y) / 100, rotation: r, scale: s };
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.4}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      PARTS.forEach((p, i) => {
        const el = q(`[data-part="${p.key}"]`);
        const a = apartOf(p);
        gsap.set(el, a);
        gsap.set(q(`[data-for="${p.key}"]`), { x: a.x, y: a.y });
        // converge — x and y on different easings, so each piece travels its own curve
        tl.to(el, { x: 0, duration: 0.34, ease: "power2.inOut" }, 0.08 + i * 0.03)
          .to(el, { y: 0, duration: 0.34, ease: i === 1 ? "sine.out" : "sine.inOut" }, 0.08 + i * 0.03)
          .to(el, { rotation: 0, scale: 1, duration: 0.34, ease: "power2.inOut" }, 0.08 + i * 0.03)
          // part again for the finale, mirrored paths
          .to(el, { x: () => -a.x() * 0.8, y: () => a.y() * 0.6 + stage.offsetHeight * 0.08, rotation: -a.rotation * 0.6, scale: a.scale, duration: 0.24, ease: "power2.in" }, 0.76);
      });

      tl.fromTo(q("[data-part-label]"), { opacity: 1 }, { opacity: 0, duration: 0.08, stagger: 0.02 }, 0.3)
        .fromTo(q("[data-shadow]"), { scaleX: 0.4, opacity: 0.15 }, { scaleX: 1, opacity: 0.55, duration: 0.3 }, 0.12)
        .add(() => cue("snap"), 0.44)
        .fromTo(q("[data-snap]"), { scale: 0.6, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.1, ease: "power2.out", immediateRender: false }, 0.43)
        .fromTo(q("[data-word]"), { yPercent: 110 }, { yPercent: 0, duration: 0.1, stagger: 0.03, ease: "power3.out" }, 0.5)
        .to(q("[data-word]"), { yPercent: -110, duration: 0.08, stagger: 0.02, ease: "power2.in" }, 0.74)
        .to(q("[data-shadow]"), { scaleX: 0.3, opacity: 0.1, duration: 0.2 }, 0.78)
        .to(q("[data-guide]"), { scaleX: 1, duration: 0.3 }, 0);

      // decorative float on inner layers while the pieces are apart
      const bobs = q("[data-bob]").map((b, i) =>
        gsap.to(b, { y: i % 2 ? 10 : -12, rotation: i % 2 ? -1.2 : 1.2, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }),
      );
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * 4.2}`,
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
          <span
            key={`l-${p.key}`}
            className={`micro ${styles.partLabel}`}
            data-part-label
            data-for={p.key}
            aria-hidden="true"
          >
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
