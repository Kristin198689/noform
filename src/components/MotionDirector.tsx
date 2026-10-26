"use client";

import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { gsap, MOTION_OK, refreshInOrder, ScrollTrigger } from "@/lib/gsap";
import { cue } from "@/lib/sound";

gsap.registerPlugin(SplitText);

/** Elements that already run their own, more specific timeline. */
const OWNED =
  "[data-pointer-label],[data-label],[data-lab-mark],[data-study-label],[data-code],[data-fade],[data-reveal],[data-split],[data-word],[data-no-auto]";

/**
 * Site-wide motion vocabulary, one scenario per element class, so every section shares the same grammar:
 * headings rise line by line (then rest for reading), micro labels wipe in like a readout,
 * rules and frames draw, registration crosses turn in, photo layers move at their own speed.
 * Only transform / opacity / clip-path are animated. Reduced motion: nothing here runs.
 */
export function MotionDirector() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const main = document.getElementById("content");
      if (!main) return;

      // 1. Headings: masked line/char rise, once, then they stay still.
      main.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const chars = el.dataset.split === "chars";
        SplitText.create(el, {
          type: chars ? "chars,lines" : "words,lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          aria: "auto",
          onSplit: (self) =>
            gsap.from(chars ? self.chars : self.words, {
              yPercent: 110,
              rotate: chars ? 0 : 3,
              duration: chars ? 0.9 : 1.05,
              ease: "expo.out",
              stagger: chars ? 0.035 : 0.06,
              onStart: () => cue("click", 0.5),
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
            }),
        });
      });

      // 2. Micro labels and codes: a left-to-right readout wipe.
      const micro = Array.from(main.querySelectorAll<HTMLElement>(".micro, .deco")).filter(
        (el) => !el.matches(OWNED) && !el.closest(OWNED),
      );
      gsap.set(micro, { clipPath: "inset(0 100% 0 0)" });
      ScrollTrigger.batch(micro, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { clipPath: "inset(0 0% 0 0)", duration: 0.75, ease: "power3.out", stagger: 0.06, overwrite: true }),
      });

      // 3. Rules: any *Rule line not driven elsewhere draws from its origin.
      const rules = Array.from(main.querySelectorAll<HTMLElement>("[class*='Rule'], [class*='rule']")).filter(
        (el) =>
          !el.matches("[data-hline],[data-guide-h],[data-lab-guide],[data-converge-l],[data-converge-r]") &&
          !el.closest(OWNED) &&
          el.offsetWidth > el.offsetHeight,
      );
      gsap.set(rules, { scaleX: 0, transformOrigin: "left center" });
      ScrollTrigger.batch(rules, {
        start: "top 95%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { scaleX: 1, duration: 1.1, ease: "power3.inOut", stagger: 0.05, overwrite: true }),
      });

      // 4. Registration crosses turn in.
      const crosses = Array.from(main.querySelectorAll<HTMLElement>(".cross"));
      gsap.set(crosses, { rotate: -90, scale: 0.3, opacity: 0 });
      ScrollTrigger.batch(crosses, {
        start: "top 96%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { rotate: 0, scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2)", stagger: 0.04, overwrite: true }),
      });

      // 5. Layers at different speeds (data-speed: >0 lags behind the scroll, <0 runs ahead).
      main.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = Number(el.dataset.speed) || 0;
        gsap.fromTo(
          el,
          { yPercent: -speed * 10 },
          {
            yPercent: speed * 10,
            ease: "none",
            scrollTrigger: { trigger: el.closest("[data-section]") ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      main.querySelectorAll<HTMLElement>("[data-drift-x]").forEach((el) => {
        const d = Number(el.dataset.driftX) || 0;
        gsap.fromTo(
          el,
          { xPercent: -d },
          {
            xPercent: d,
            ease: "none",
            scrollTrigger: { trigger: el.closest("[data-section]") ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Top-anchored settle: a slow approach from 1.06 to 1, origin at the top edge (no vertical drift).
      main.querySelectorAll<HTMLElement>("[data-settle]").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.06, transformOrigin: "50% 0%" },
          { scale: 1, ease: "none", scrollTrigger: { trigger: el.closest("[data-section]") ?? el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });

      // 6. Photographs open with a short vertical wipe when they enter.
      main.querySelectorAll<HTMLElement>("[data-wipe]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.4,
            ease: "expo.inOut",
            onStart: () => cue("shutter"),
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      // 7. Section hand-offs: the hero recedes as the first pause slides over it.
      const hero = document.getElementById("hero");
      if (hero) {
        ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom 40%", onEnterBack: () => cue("chime") });
        gsap
          .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
          .to(hero.querySelector("[data-hero-photo]"), { scale: 1.1, yPercent: 8, ease: "none" }, 0)
          .to(hero.querySelector("[data-hero-brand]"), { yPercent: -60, opacity: 0.2, ease: "none" }, 0)
          .to(hero.querySelector("[data-hero-dim]"), { opacity: 0.7, ease: "none" }, 0);
      }
      // gray sections rise in like a sheet
      main.querySelectorAll<HTMLElement>("[data-sheet]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(8% 4% 0% 4% round 0px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 45%", scrub: true } },
        );
      });
    });

    // Desktop pointer depth in the hero (fine pointers only).
    mm.add(`${MOTION_OK} and (hover: hover) and (pointer: fine)`, () => {
      const hero = document.getElementById("hero");
      const brand = hero?.querySelector<HTMLElement>("[data-hero-tilt]");
      const photo = hero?.querySelector<HTMLElement>("[data-hero-photo-tilt]");
      if (!hero || !brand || !photo) return;
      const bx = gsap.quickTo(brand, "x", { duration: 0.9, ease: "power3.out" });
      const by = gsap.quickTo(brand, "y", { duration: 0.9, ease: "power3.out" });
      const px = gsap.quickTo(photo, "x", { duration: 1.4, ease: "power3.out" });
      const py = gsap.quickTo(photo, "y", { duration: 1.4, ease: "power3.out" });
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        bx(nx * 14);
        by(ny * 10);
        px(nx * -18);
        py(ny * -12);
      };
      hero.addEventListener("pointermove", onMove);
      return () => hero.removeEventListener("pointermove", onMove);
    });

    // Safety net: if a reveal was skipped (very fast scroll, anchor jump, late re-measure),
    // anything already on screen is shown — content is never left hidden behind a mask.
    const rescue = () => {
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("#content .micro, #content .deco, #content [data-wipe]").forEach((el) => {
        const cp = el.style.clipPath;
        if (!cp || !/100%/.test(cp)) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) gsap.to(el, { clipPath: el.hasAttribute("data-wipe") ? "inset(0 0 0% 0)" : "inset(0 0% 0 0)", duration: 0.5, overwrite: true });
      });
      document.querySelectorAll<HTMLElement>("#content [class*='Rule'], #content .cross").forEach((el) => {
        if (el.style.opacity === "0" || /scaleX\(0\)|scale\(0\.3/.test(el.style.transform)) {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) gsap.to(el, { scaleX: 1, scale: 1, rotate: 0, opacity: 1, duration: 0.5, overwrite: true });
        }
      });
    };
    ScrollTrigger.addEventListener("scrollEnd", rescue);
    ScrollTrigger.addEventListener("refresh", rescue);

    // Fonts change line breaks: re-measure once they are in.
    void document.fonts.ready.then(() => refreshInOrder());
    const onLoad = () => refreshInOrder();
    window.addEventListener("load", onLoad, { once: true });
    requestAnimationFrame(refreshInOrder);
    return () => {
      ScrollTrigger.removeEventListener("scrollEnd", rescue);
      ScrollTrigger.removeEventListener("refresh", rescue);
      window.removeEventListener("load", onLoad);
      mm.revert();
    };
  });

  return null;
}
