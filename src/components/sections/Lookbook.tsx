"use client";

import { useRef } from "react";
import { Img, type MediaId } from "@/components/Img";
import { useSite } from "@/components/SiteProvider";
import { useMotionMode } from "@/lib/useMotionMode";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Messages } from "@/i18n/messages";
import styles from "./Lookbook.module.css";

type Strings = Pick<
  Messages,
  | "lookbook.title"
  | "lookbook.subtitle"
  | "lookbook.section"
  | "lookbook.look"
  | "lookbook.frame"
  | "ui.scroll"
  | "ui.drag"
  | "alt.low"
  | "alt.back"
  | "alt.overhead"
  | "alt.crouch"
  | "alt.stride"
>;

type Item = {
  key: string;
  shape: "tall" | "wide" | "object" | "objectTall";
  media: MediaId[];
  alt?: keyof Strings;
  caption?: keyof Strings | string;
  /** vertical offset in vh, gives the ring its uneven rhythm */
  y: number;
};

// One main object on the ring; the three visor angles crossfade in a single slot.
const ITEMS: Item[] = [
  { key: "look01", shape: "tall", media: ["look-01"], alt: "alt.low", caption: "lookbook.look", y: 3 },
  { key: "visor", shape: "object", media: ["visor-01", "visor-02", "visor-03"], caption: "VISOR 01 / SILVER", y: -4 },
  { key: "look03", shape: "tall", media: ["look-03"], alt: "alt.overhead", caption: "lookbook.frame", y: -6 },
  { key: "hoodie", shape: "objectTall", media: ["hoodie"], y: 5 },
  { key: "look04", shape: "wide", media: ["look-04"], alt: "alt.crouch", y: -3 },
  { key: "look02", shape: "tall", media: ["look-02"], alt: "alt.back", y: 4 },
  { key: "cargo", shape: "objectTall", media: ["cargo"], y: -5 },
  { key: "look05", shape: "wide", media: ["look-05"], alt: "alt.stride", y: 2 },
];
const N = ITEMS.length;
const STEP = 360 / N;
const SCROLL_TURN = 2.1; // ≈210svh for one full revolution

export function Lookbook({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const progressBar = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  // Static, accessible list until we know motion is welcome (SSR / no JS / reduced motion).
  const mode = useMotionMode();
  const { tick } = useSite();
  const api = useRef<{ nudge: (deg: number) => void } | null>(null);

  useGSAP(
    () => {
      if (mode !== "ring" || !root.current || !ring.current) return;
      const els = gsap.utils.toArray<HTMLElement>("[data-ring-item]", ring.current);
      const visorImgs = gsap.utils.toArray<HTMLElement>("[data-visor-angle]", ring.current);
      const state = { scroll: 0, drag: 0, vel: 0, cur: -1, dragging: false };
      let front = -1;
      let visorAngle = -1;
      let lastZ: number[] = [];
      let keyboardMove = false;

      const render = (angle: number) => {
        const w = window.innerWidth;
        const mobile = w < 768;
        const rx = mobile ? w * 0.42 : Math.min(w * 0.38, 700);
        const rz = mobile ? 340 : 720;
        const vh = window.innerHeight / 100;
        for (let i = 0; i < N; i++) {
          const el = els[i];
          const item = ITEMS[i];
          if (!el || !item) continue;
          const rad = ((i * STEP - angle) * Math.PI) / 180;
          const s = Math.sin(rad);
          const c = Math.cos(rad);
          const depth = (c + 1) / 2;
          const x = s * rx;
          const z = (c - 1) * rz;
          const y = item.y * vh * (mobile ? 0.5 : 1);
          const rot = -s * 28;
          const hidden = mobile && c < 0.05;
          el.style.transform = `translate(-50%, -50%) perspective(1400px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`;
          el.style.opacity = hidden ? "0" : (0.22 + 0.78 * depth ** 1.4).toFixed(3);
          const zi = Math.round(depth * 100);
          if (lastZ[i] !== zi) {
            el.style.zIndex = String(zi);
            lastZ[i] = zi;
          }
          el.toggleAttribute("data-front", c > 0.92);
        }
        const norm = ((angle % 360) + 360) % 360;
        const f = Math.round(norm / STEP) % N;
        if (f !== front) {
          if (front !== -1) tick();
          front = f;
          if (counter.current) counter.current.textContent = String(f + 1).padStart(2, "0");
          if (keyboardMove && live.current) {
            const item = ITEMS[f];
            const label = item?.alt ? t[item.alt] : item?.caption && item.caption in t ? t[item.caption as keyof Strings] : item?.caption;
            live.current.textContent = `${String(f + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")} — ${label ?? ""}`;
            keyboardMove = false;
          }
        }
        if (progressBar.current) progressBar.current.style.transform = `scaleX(${(norm / 360).toFixed(4)})`;
        const va = Math.floor(norm / 120) % 3;
        if (va !== visorAngle) {
          visorAngle = va;
          visorImgs.forEach((img, k) => img.toggleAttribute("data-active", k === va));
        }
      };

      const loop = () => {
        if (!state.dragging && Math.abs(state.vel) > 0.01) {
          state.drag += state.vel;
          state.vel *= 0.92;
        }
        const target = state.scroll + state.drag;
        const delta = target - state.cur;
        if (Math.abs(delta) < 0.005 && state.cur !== -1) return;
        state.cur = state.cur === -1 ? target : state.cur + delta * Math.min(1, 0.14 * gsap.ticker.deltaRatio());
        render(state.cur);
      };

      render(0);
      state.cur = 0;

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: () => `+=${window.innerHeight * SCROLL_TURN}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          state.scroll = self.progress * 360;
        },
      });

      // Only run the ticker while the scene is near the viewport.
      let running = false;
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: () => `+=${window.innerHeight * (SCROLL_TURN + 2)}`,
        onToggle: (self) => {
          if (self.isActive && !running) {
            gsap.ticker.add(loop);
            running = true;
          } else if (!self.isActive && running) {
            gsap.ticker.remove(loop);
            running = false;
          }
        },
      });

      // Drag / swipe changes the angular offset; vertical swipes still scroll the page (touch-action: pan-y).
      const stage = ring.current.parentElement as HTMLElement;
      let lastX = 0;
      const down = (e: PointerEvent) => {
        if (e.button !== 0) return;
        state.dragging = true;
        state.vel = 0;
        lastX = e.clientX;
        stage.setPointerCapture(e.pointerId);
        stage.dataset.dragging = "true";
      };
      const move = (e: PointerEvent) => {
        if (!state.dragging) return;
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        const deg = -dx * (window.innerWidth < 768 ? 0.35 : 0.22);
        state.drag += deg;
        state.vel = deg;
      };
      const up = (e: PointerEvent) => {
        if (!state.dragging) return;
        state.dragging = false;
        delete stage.dataset.dragging;
        if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      };
      stage.addEventListener("pointerdown", down);
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerup", up);
      stage.addEventListener("pointercancel", up);

      api.current = {
        nudge: (deg: number) => {
          keyboardMove = true;
          state.vel = 0;
          const total = Math.round((state.scroll + state.drag + deg) / STEP) * STEP;
          state.drag = total - state.scroll;
        },
      };

      return () => {
        gsap.ticker.remove(loop);
        stage.removeEventListener("pointerdown", down);
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerup", up);
        stage.removeEventListener("pointercancel", up);
        api.current = null;
        lastZ = [];
      };
    },
    { scope: root, dependencies: [mode, tick], revertOnUpdate: true },
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (!api.current) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      api.current.nudge(STEP);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      api.current.nudge(-STEP);
    }
  };

  const captionOf = (item: Item) => (item.caption ? (item.caption in t ? t[item.caption as keyof Strings] : item.caption) : null);

  return (
    <section
      id="lookbook"
      data-section
      ref={root}
      className={styles.lookbook}
      data-mode={mode}
      aria-labelledby="lookbook-title"
    >
      <div className={styles.frame}>
        <p className={styles.bgWord} aria-hidden="true">UNRESTRICTED</p>

        <div className={styles.bar}>
          <p className="micro">{t["lookbook.section"]}</p>
          <span className={styles.barRule} aria-hidden="true" />
        </div>

        <div
          className={styles.stage}
          tabIndex={mode === "ring" ? 0 : undefined}
          role={mode === "ring" ? "group" : undefined}
          aria-roledescription={mode === "ring" ? "carousel" : undefined}
          aria-label={mode === "ring" ? t["lookbook.title"] : undefined}
          aria-describedby={mode === "ring" ? "lookbook-hint" : undefined}
          onKeyDown={onKey}
        >
          <div ref={ring} className={styles.ring}>
            {ITEMS.map((item) => {
              const caption = captionOf(item);
              return (
                <figure key={item.key} data-ring-item className={styles.item} data-shape={item.shape}>
                  <div className={styles.media}>
                    {item.media.length > 1 ? (
                      item.media.map((m, k) => (
                        <div key={m} className={styles.angle} data-visor-angle data-active={k === 0 ? "" : undefined}>
                          <Img id={m} alt="" sizes="(max-width: 767px) 60vw, 30vw" draggable={false} />
                        </div>
                      ))
                    ) : (
                      <Img
                        id={item.media[0] as MediaId}
                        alt={item.alt ? t[item.alt] : ""}
                        sizes={item.shape === "wide" ? "(max-width: 767px) 70vw, 34vw" : "(max-width: 767px) 50vw, 24vw"}
                        draggable={false}
                      />
                    )}
                  </div>
                  {caption && (
                    <figcaption className={`micro ${styles.caption}`}>
                      <span className={styles.capRule} aria-hidden="true" />
                      {caption.split(" / ").map((part, k, arr) => (
                        <span key={part}>
                          {part}
                          {k < arr.length - 1 ? " /" : ""}
                        </span>
                      ))}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </div>

        <div className={styles.titleBlock}>
          <h2 id="lookbook-title" className={`display ${styles.title}`}>{t["lookbook.title"]}</h2>
          <p className={`micro ${styles.subtitle}`}>{t["lookbook.subtitle"]}</p>
        </div>

        <p id="lookbook-hint" className={`micro ${styles.hint}`}>
          {mode === "ring" ? (
            <>
              {t["ui.scroll"]} <span aria-hidden="true">·</span> {t["ui.drag"]} <span aria-hidden="true">⟷</span>
            </>
          ) : (
            <>
              {t["ui.drag"]} <span aria-hidden="true">⟷</span>
            </>
          )}
        </p>

        <div className={styles.progress} aria-hidden="true">
          <span className={styles.track}>
            <span ref={progressBar} className={styles.fill} />
          </span>
          <span className="micro">
            <span ref={counter} className="pink">01</span> — {String(N).padStart(2, "0")}
          </span>
        </div>
        <p ref={live} className="sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
