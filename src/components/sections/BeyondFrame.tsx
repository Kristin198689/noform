"use client";

import { useRef } from "react";
import { Img } from "@/components/Img";
import { gsap, refreshInOrder, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/useMotionMode";
import type { Messages } from "@/i18n/messages";
import styles from "./BeyondFrame.module.css";

const MAX_PANELS = 7;
// one `sizes` for the whole frames and the panel faces, so every <img> resolves to the same decoded file
const SIZES = "(max-width: 767px) 88vw, 76vh";

type Pose = { x: number; y: number; z: number; ry: number; rx: number };
// Spatial composition per panel: x in panel widths, y in frame heights, z in px, angles in degrees.
// Far panels turn a little and show their fragment; near ones turn hard into thin blades in front of the word.
const DESKTOP: Pose[] = [
  { x: -7.2, y: -0.05, z: -320, ry: 30, rx: 4 },
  { x: -4.8, y: 0.05, z: 200, ry: -60, rx: -3 },
  { x: -2.4, y: -0.03, z: -140, ry: 26, rx: 2 },
  { x: 0, y: 0.06, z: 240, ry: -64, rx: -4 },
  { x: 2.4, y: -0.05, z: -140, ry: -26, rx: 3 },
  { x: 4.8, y: 0.04, z: 200, ry: 60, rx: -2 },
  { x: 7.2, y: -0.03, z: -320, ry: -30, rx: 4 },
];
const PHONE: Pose[] = [
  { x: -3, y: -0.12, z: -260, ry: 28, rx: 6 },
  { x: -1.5, y: 0.09, z: 140, ry: -58, rx: -5 },
  { x: 0, y: -0.04, z: -90, ry: 22, rx: 4 },
  { x: 1.5, y: 0.11, z: 140, ry: 58, rx: -5 },
  { x: 3, y: -0.09, z: -260, ry: -28, rx: 6 },
];

const STAGES: [number, string][] = [
  [0.15, "PORTRAIT"],
  [0.45, "SPLIT"],
  [0.6, "BEYOND"],
  [0.85, "RETURN"],
  [1.01, "UNDER GLASS"],
];

/**
 * BEYOND THE FRAME. A whole portrait splits into vertical panels of one shared image plane; they part in
 * depth, turn at different angles and open the pink line between them; then they turn over and close on
 * the second photograph (under glass). The assembled states are the flat whole photographs, so no seam can
 * show; the panels only exist in between and only once both photographs are decoded.
 */
export function BeyondFrame({ t }: { t: Pick<Messages, "alt.portrait" | "alt.glass"> }) {
  const root = useRef<HTMLElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      const el = root.current;
      if (mode !== "ring" || !el) return;
      const q = gsap.utils.selector(el);
      const wholeA = el.querySelector<HTMLElement>("[data-whole='a']");
      const wholeB = el.querySelector<HTMLElement>("[data-whole='b']");
      const panelsEl = el.querySelector<HTMLElement>("[data-panels]");
      const world = el.querySelector<HTMLElement>("[data-world]");
      const pct = el.querySelector<HTMLElement>("[data-pct]");
      const bar = el.querySelector<HTMLElement>("[data-bar]");
      const stage = el.querySelector<HTMLElement>("[data-stage-name]");
      if (!wholeA || !wholeB || !panelsEl || !world) return;

      const phone = window.innerWidth < 768;
      const n = phone ? 5 : MAX_PANELS;
      const poses = phone ? PHONE : DESKTOP;
      const slots = q("[data-slot]").slice(0, n);
      const spins = q("[data-spin]").slice(0, n);
      const nums = q("[data-num]").slice(0, n);
      const faces = spins.map((spin) => [spin.children[0] as HTMLElement, spin.children[1] as HTMLElement] as const);
      const fwA = () => wholeA.getBoundingClientRect().width / n;
      const fwB = () => wholeB.getBoundingClientRect().width / n;
      const haA = () => wholeA.getBoundingClientRect().height;

      // Both photographs must be decoded before the panels may appear; until then the whole frame stays.
      let ready = false;
      let last = 0;
      const gate = (p: number) => {
        last = p;
        const panels = ready && p > 0.15 && p < 0.85;
        panelsEl.style.visibility = panels ? "visible" : "hidden";
        wholeA.style.visibility = !panels && p <= 0.6 ? "visible" : "hidden";
        wholeB.style.visibility = !panels && p > 0.6 ? "visible" : "hidden";
        // Which side of each panel faces the viewer, from its real angle: WebKit does not reliably honour
        // backface-visibility in nested 3D layers, so the hidden side is switched off explicitly.
        if (panels) {
          const worldY = Number(gsap.getProperty(world, "rotationY")) || 0;
          spins.forEach((spin, i) => {
            const front = Math.cos(((Number(gsap.getProperty(spin, "rotationY")) + worldY) * Math.PI) / 180) >= 0;
            const [a, b] = faces[i]!;
            a.style.visibility = front ? "visible" : "hidden";
            b.style.visibility = front ? "hidden" : "visible";
          });
        }
        if (pct) pct.textContent = String(Math.round(p * 100)).padStart(3, "0");
        if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
        if (stage) stage.textContent = (STAGES.find(([end]) => p < end) ?? STAGES[STAGES.length - 1]!)[1];
      };
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
          imgs.forEach((img) => (img.loading = "eager"));
          void Promise.all(imgs.map((img) => img.decode().catch(() => undefined))).then(() => {
            ready = imgs.every((img) => img.complete && img.naturalWidth > 0);
            gate(last);
          });
        },
        { rootMargin: "300% 0px" },
      );
      io.observe(el);

      gsap.set(q("[data-word]"), { xPercent: -50, yPercent: -50 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => gate(tl.progress()),
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * 5}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 0–15 %: the whole portrait, time to look (nothing moves).
      // 15–45 %: the panels part in depth; 45–60 %: they hold and drift; 60–85 %: they turn over and close on frame 02.
      slots.forEach((slot, i) => {
        const pose = poses[i]!;
        const c = i - (n - 1) / 2;
        const spin = spins[i]!;
        const lag = Math.abs(c) * 0.01;
        const homeA = () => c * fwA();
        const homeB = () => c * fwB();
        tl.fromTo(
          slot,
          { x: homeA, y: 0, z: 0 },
          { x: () => pose.x * fwA(), y: () => pose.y * haA(), z: pose.z, duration: 0.28, ease: "power2.inOut" },
          0.15 + lag,
        )
          .fromTo(spin, { rotationY: 0, rotationX: 0 }, { rotationY: pose.ry, rotationX: pose.rx, duration: 0.28, ease: "power2.inOut" }, 0.15 + lag)
          .to(slot, { z: pose.z + 40, duration: 0.14, ease: "sine.inOut" }, 0.46)
          .to(spin, { rotationY: pose.ry * 0.86, duration: 0.14, ease: "sine.inOut" }, 0.46)
          // turn over through the edge-on position: the front (portrait) hides, the back (under glass) shows
          .to(slot, { x: homeB, y: 0, z: 0, duration: 0.21, ease: "power2.inOut" }, 0.6 + Math.abs(c) * 0.012)
          .to(spin, { rotationY: Math.sign(pose.ry) * 180, rotationX: 0, duration: 0.21, ease: "power2.inOut" }, 0.6 + Math.abs(c) * 0.012);
      });

      tl.fromTo(world, { rotationY: 0, rotationX: 0 }, { rotationY: -9, rotationX: 3, duration: 0.3, ease: "power2.inOut" }, 0.15)
        .to(world, { rotationY: 7, rotationX: -2, duration: 0.15, ease: "sine.inOut" }, 0.45)
        .to(world, { rotationY: 0, rotationX: 0, duration: 0.24, ease: "power2.inOut" }, 0.6)
        .fromTo(q("[data-word]"), { opacity: 0, z: -520, scale: 0.86 }, { opacity: 1, z: -20, scale: 1, duration: 0.19, ease: "power2.out" }, 0.27)
        .to(q("[data-word]"), { opacity: 0, z: -420, scale: 0.9, duration: 0.09, ease: "power2.in" }, 0.6)
        .fromTo(nums, { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.008 }, 0.24)
        .to(nums, { opacity: 0, duration: 0.04 }, 0.6)
        .fromTo(q("[data-mark='a']"), { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.15)
        .fromTo(q("[data-mark='b']"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.85)
        .fromTo(q("[data-f1]"), { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.66)
        .fromTo(q("[data-f2]"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.7)
        // 85–100 %: the whole second frame holds, then eases back a touch as the scene hands over
        .fromTo(wholeB, { scale: 1 }, { scale: 0.97, duration: 0.08, ease: "power1.in" }, 0.92);
      gate(0);
      requestAnimationFrame(refreshInOrder);
      return () => io.disconnect();
    },
    { scope: root, dependencies: [mode], revertOnUpdate: true },
  );

  return (
    <section ref={root} id="beyond" data-section data-theme="dark" className={styles.scene} data-mode={mode} aria-labelledby="beyond-title">
      <span className={styles.guide} style={{ top: "14%" }} aria-hidden="true" />
      <span className={styles.guide} style={{ top: "88%" }} aria-hidden="true" />
      <p className={`micro ${styles.label}`} aria-hidden="true">
        <span data-f1>FRAME 01 / PORTRAIT</span>
        <span className={styles.f2} data-f2>
          FRAME 02 / UNDER GLASS
        </span>
      </p>
      <p className={`micro ${styles.labelR}`} aria-hidden="true">
        <span data-stage-name>PORTRAIT</span>
      </p>
      <div className={`micro ${styles.foot}`} aria-hidden="true">
        <span>
          <span data-pct>000</span> %
        </span>
        <span className={styles.track}>
          <span className={styles.bar} data-bar />
          {[15, 45, 60, 85].map((m) => (
            <span key={m} className={styles.tickMark} style={{ left: `${m}%` }} />
          ))}
        </span>
      </div>
      <p className={`micro ${styles.footR}`} aria-hidden="true">
        BEYOND THE FRAME / 2026
      </p>

      <div className={styles.stage}>
        <div className={`${styles.whole} ${styles.wholeA}`} data-whole="a">
          <Img id="beyond-portrait" alt={t["alt.portrait"]} sizes={SIZES} draggable={false} />
          <span className={styles.mark} data-mark="a" aria-hidden="true" />
        </div>
        <div className={`${styles.whole} ${styles.wholeB}`} data-whole="b">
          <Img id="beyond-glass" alt={t["alt.glass"]} sizes={SIZES} draggable={false} />
          <span className={styles.mark} data-mark="b" aria-hidden="true" />
        </div>

        <div className={styles.world} data-world>
          <h2 id="beyond-title" className={`display ${styles.word}`} data-word>
            <span>BEYOND</span> <span>THE</span> <span>FRAME</span>
          </h2>
          <div className={styles.panels} data-panels aria-hidden="true">
            {Array.from({ length: MAX_PANELS }, (_, i) => (
              <div key={i} className={styles.slot} data-slot style={{ "--i": i } as React.CSSProperties}>
                <span className={`micro ${styles.num}`} data-num>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.spin} data-spin>
                  <div className={`${styles.face} ${styles.faceA}`}>
                    <Img id="beyond-portrait" alt="" sizes={SIZES} draggable={false} />
                  </div>
                  <div className={`${styles.face} ${styles.faceB}`}>
                    <Img id="beyond-glass" alt="" sizes={SIZES} draggable={false} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
