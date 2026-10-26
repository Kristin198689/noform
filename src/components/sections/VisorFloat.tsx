"use client";

/*
 * Weightless visor scene — the first implementation, chosen by the client after comparing versions.
 * Motion is kept exactly as originally built: the visor rises in, drifts, changes angle, settles
 * and lifts out of frame at the end.
 */

import { useRef } from "react";
import { Img } from "@/components/Img";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/useMotionMode";
import styles from "./VisorFloat.module.css";

const ANGLES = ["visor-01", "visor-02", "visor-03"] as const;

export function VisorFloat({ label }: { label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current) return;
      const q = gsap.utils.selector(root);
      const angle = q("[data-angle]");
      const readout = root.current.querySelector<HTMLElement>("[data-angle-readout]");
      const tilt = root.current.querySelector<HTMLElement>("[data-tilt-readout]");
      const mobile = window.innerWidth < 768;
      const drift = mobile ? 7 : 9; // vw

      gsap.set(angle, { opacity: 0 });
      gsap.set(angle[0] ?? [], { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 2}`, // slowed slightly at the client's request (was 1.5)
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const a = p < 0.38 ? 1 : p < 0.66 ? 2 : 3;
            if (readout) readout.textContent = `0${a}`;
            const r = gsap.getProperty(q("[data-floater]")[0] ?? {}, "rotation") as number;
            if (tilt) tilt.textContent = `${r >= 0 ? "+" : "−"}${String(Math.abs(Math.round(r))).padStart(2, "0")}°`;
          },
        },
      });

      tl.fromTo(q("[data-orbit]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35 }, 0)
        .fromTo(q("[data-guide]"), { scaleX: 0 }, { scaleX: 1, duration: 0.3, stagger: 0.04 }, 0)
        .fromTo(q("[data-vguide]"), { scaleY: 0 }, { scaleY: 1, duration: 0.3 }, 0.05)
        .fromTo(q("[data-label]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.03 }, 0.08)
        .fromTo(
          q("[data-floater]"),
          { yPercent: 70, xPercent: 0, rotation: -10, rotationY: -12, scale: 0.86, opacity: 0 },
          { yPercent: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" },
          0,
        )
        .to(q("[data-floater]"), { x: `${drift}vw`, rotation: 7, rotationY: 10, duration: 0.25, ease: "sine.inOut" }, 0.2)
        .to(angle[0] ?? [], { opacity: 0, duration: 0.08 }, 0.34)
        .to(angle[1] ?? [], { opacity: 1, duration: 0.08 }, 0.34)
        .to(q("[data-floater]"), { x: `${-drift}vw`, rotation: -6, rotationY: -10, scale: 1.06, duration: 0.25, ease: "sine.inOut" }, 0.45)
        .to(angle[1] ?? [], { opacity: 0, duration: 0.08 }, 0.62)
        .to(angle[2] ?? [], { opacity: 1, duration: 0.08 }, 0.62)
        .to(q("[data-floater]"), { x: 0, rotation: 0, rotationY: 0, scale: 1, duration: 0.15, ease: "sine.inOut" }, 0.72)
        .to(q("[data-floater]"), { yPercent: -60, opacity: 0, duration: 0.13, ease: "power2.in" }, 0.87)
        .to(q("[data-shadow]"), { scaleX: 0.55, opacity: 0.15, duration: 0.25 }, 0.2)
        .to(q("[data-shadow]"), { scaleX: 1, opacity: 0.5, duration: 0.25 }, 0.45);

      const bob = gsap.to(q("[data-bob]"), {
        y: mobile ? -8 : -14,
        rotation: 1.4,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        paused: true,
      });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * 4}`,
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
        <div className={styles.floater} data-floater>
          <div className={styles.bob} data-bob>
            {ANGLES.map((id) => (
              <div key={id} className={styles.angle} data-angle>
                <Img id={id} alt="" sizes="(max-width: 767px) 92vw, 60vw" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
