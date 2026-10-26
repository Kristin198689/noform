"use client";

import { useRef } from "react";
import { Img } from "@/components/Img";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/useMotionMode";
import styles from "./VisorFloat.module.css";

// Renders normalised to one optical centre and visible size (scripts/build-images.mjs).
const ANGLES = ["visor-float-01", "visor-float-02", "visor-float-03"] as const;

/**
 * Weightless study, refined from the first implementation (VisorFloatV1):
 * same drift right → drift left → settle, but the visor is already in frame before the pin,
 * angle hand-overs are long, overlapping crossfades on centred renders (no blur flashes, no jumps),
 * and instead of vanishing early it keeps company with the scroll, sinking slowly, and leaves
 * with the scene. Tilts stay within ±7°. Silent until a sound is approved.
 */
export function VisorFloat({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current) return;
      const q = gsap.utils.selector(root);
      const [a1, a2, a3] = q("[data-angle]");
      const floater = q("[data-floater]");
      const readout = root.current.querySelector<HTMLElement>("[data-angle-readout]");
      const tilt = root.current.querySelector<HTMLElement>("[data-tilt-readout]");
      const phone = window.innerWidth < 768;
      const drift = phone ? 6 : 9; // vw

      gsap.set([a2, a3], { opacity: 0 });
      gsap.set(a1 ?? [], { opacity: 1 });

      const readouts = () => {
        const o2 = Number(gsap.getProperty(a2 ?? {}, "opacity"));
        const o3 = Number(gsap.getProperty(a3 ?? {}, "opacity"));
        if (readout) readout.textContent = `0${o3 > 0.5 ? 3 : o2 > 0.5 ? 2 : 1}`;
        const r = Number(gsap.getProperty(floater[0] ?? {}, "rotation"));
        if (tilt) tilt.textContent = `${r >= 0 ? "+" : "−"}${String(Math.abs(Math.round(r))).padStart(2, "0")}°`;
      };

      // Arrival: the visor rises into frame while the scene scrolls in, so there is never
      // a frame with guides and no object.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 20%", scrub: 0.6 },
        })
        .fromTo(floater, { yPercent: 45, rotation: -6, rotationY: -8, scale: 0.92 }, { yPercent: 0, rotation: 0, rotationY: 0, scale: 1, duration: 1, ease: "power2.out" }, 0)
        .fromTo(q("[data-orbit]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 }, 0)
        .fromTo(q("[data-guide]"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.1 }, 0)
        .fromTo(q("[data-vguide]"), { scaleY: 0 }, { scaleY: 1, duration: 0.8 }, 0.1)
        .fromTo(q("[data-label]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, 0.4);

      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.9}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: readouts,
          },
        })
        // drift right with the lean of travel; 01 hands over to 02 in a long overlap
        .to(floater, { x: `${drift}vw`, rotation: 6, rotationY: 8, duration: 0.3, ease: "sine.inOut" }, 0)
        .to(a1 ?? [], { opacity: 0, duration: 0.14, ease: "sine.inOut" }, 0.2)
        .to(a2 ?? [], { opacity: 1, duration: 0.12, ease: "sine.inOut" }, 0.18)
        // drift left, counter-lean
        .to(floater, { x: `${-drift}vw`, rotation: -5, rotationY: -8, scale: 1.04, duration: 0.3, ease: "sine.inOut" }, 0.3)
        // settle in the centre
        .to(floater, { x: 0, rotation: 0, rotationY: 0, scale: 1, duration: 0.12, ease: "sine.inOut" }, 0.6)
        // keep company with the scroll: a long, slow sink; 02 tips into 03 on the way down
        .to(floater, { yPercent: 46, scale: 0.94, rotation: -2, duration: 0.34, ease: "sine.inOut" }, 0.66)
        .to(a2 ?? [], { opacity: 0, duration: 0.16, ease: "sine.inOut" }, 0.72)
        .to(a3 ?? [], { opacity: 1, duration: 0.14, ease: "sine.inOut" }, 0.7)
        .to(q("[data-shadow]"), { scaleX: 0.6, opacity: 0.2, duration: 0.3 }, 0)
        .to(q("[data-shadow]"), { scaleX: 1, opacity: 0.45, duration: 0.3 }, 0.3)
        .to(q("[data-shadow]"), { scaleX: 1.25, opacity: 0.65, duration: 0.34 }, 0.66);

      // Decorative weightlessness, only while the scene is on screen.
      const bob = gsap.to(q("[data-bob]"), {
        y: phone ? -7 : -12,
        rotation: 1.2,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        paused: true,
      });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * 3.9}`,
        onToggle: (self) => (self.isActive ? bob.play() : bob.pause()),
      });
      return () => bob.kill();
    },
    { scope: root, dependencies: [mode], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={styles.float} data-mode={mode} data-theme="dark">
      <div className={styles.guides} aria-hidden="true">
        <span className={styles.h} style={{ top: "30%" }} data-guide />
        <span className={styles.h} style={{ top: "70%" }} data-guide />
        <span className={styles.v} data-vguide />
        <svg className={styles.orbit} viewBox="0 0 1000 400" preserveAspectRatio="none" focusable="false">
          <ellipse data-orbit cx="500" cy="200" rx="470" ry="150" pathLength={1} strokeDasharray="1" />
          <ellipse data-orbit cx="500" cy="200" rx="330" ry="96" pathLength={1} strokeDasharray="1" />
        </svg>
        <span className="cross" style={{ left: "12%", top: "30%" }} />
        <span className="cross" style={{ left: "88%", top: "70%" }} />
      </div>

      <p className={`micro ${styles.tl}`} data-label aria-hidden="true">
        VISOR 01 / WEIGHTLESS STUDY
      </p>
      <p className={`micro ${styles.tr}`} data-label aria-hidden="true">
        ANGLE <span className="pink" data-angle-readout>01</span> / 03
      </p>
      <p className={`micro ${styles.bl}`} data-label aria-hidden="true">
        TILT <span data-tilt-readout>+00°</span>
      </p>
      <p className={`micro ${styles.br}`} data-label aria-hidden="true">
        MIRRORED SILVER / ZERO GRAVITY
      </p>

      <div className={styles.stage} role="img" aria-label={label}>
        <div className={styles.shadow} data-shadow aria-hidden="true" />
        <div className={`${styles.floater} ${styles.floaterCentred}`} data-floater>
          <div className={styles.bob} data-bob>
            {ANGLES.map((id) => (
              <div key={id} className={styles.angle} data-angle>
                <Img id={id} alt="" sizes="(max-width: 767px) 100vw, 64vw" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
