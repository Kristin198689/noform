"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { Img, type MediaId } from "@/components/Img";
import { useSite } from "@/components/SiteProvider";
import styles from "./Chrome.module.css";

export type ChromeStrings = Pick<
  Messages,
  | "nav.index"
  | "nav.close"
  | "nav.hero"
  | "nav.lookbook"
  | "nav.about"
  | "nav.visor"
  | "nav.code"
  | "nav.scanner"
  | "nav.lab"
  | "nav.end"
  | "ui.soundOff"
  | "ui.soundOn"
>;

const ITEMS: { id: string; key: keyof ChromeStrings; media?: MediaId }[] = [
  { id: "hero", key: "nav.hero", media: "hero" },
  { id: "lookbook", key: "nav.lookbook", media: "look-01" },
  { id: "about", key: "nav.about", media: "look-06" },
  { id: "visor", key: "nav.visor", media: "visor-front" },
  { id: "code", key: "nav.code", media: "look-03" },
  { id: "scanner", key: "nav.scanner", media: "look-04" },
  { id: "lab", key: "nav.lab" },
  { id: "end", key: "nav.end" },
];

/** Section ids that belong to an index entry (pauses map to the section before them). */
const SECTION_FOR: Record<string, string> = { reset: "hero", perspective: "about", inside: "code", "study-ring": "lab", "study-helix": "lab", "study-sphere": "lab", "study-depth": "lab" };

function LangSwitch({ locale, hash, className }: { locale: Locale; hash: string; className?: string }) {
  return (
    <nav className={className} aria-label="Language">
      {locales.map((l, i) => (
        <span key={l} className={styles.langItem}>
          {i > 0 && <span aria-hidden="true" className={styles.langSep}>/</span>}
          <a
            href={`/${l}${hash ? `#${hash}` : ""}`}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            className={styles.lang}
          >
            {localeLabels[l]}
          </a>
        </span>
      ))}
    </nav>
  );
}

export function Chrome({ locale, t }: { locale: Locale; t: ChromeStrings }) {
  const { soundOn, toggleSound, section } = useSite();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MediaId | undefined>(undefined);
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState("photo");
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  // After an index jump the header stays put, so the reader keeps the controls.
  const holdUntil = useRef(0);
  const current = SECTION_FOR[section] ?? section;

  // Hide while reading downwards, return on the first upward scroll; always visible near the top,
  // while the menu is open, or while a header control has keyboard focus.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const dy = y - lastY;
        if (Math.abs(dy) < 6) return;
        const focused = header.current?.contains(document.activeElement) ?? false;
        const held = performance.now() < holdUntil.current;
        setHidden(y > 120 && dy > 0 && !focused && !held);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Which surface is under the header line: light (gray pauses, lab), photo, or dark.
  useEffect(() => {
    let frame = 0;
    const probe = () => {
      frame = 0;
      const x = window.innerWidth - 48;
      const hit = document
        .elementsFromPoint(x, 24)
        .find((el) => !header.current?.contains(el) && el.closest("[data-theme], [data-section]"));
      const surface = hit?.closest<HTMLElement>("[data-theme]");
      setTheme(surface?.dataset.theme ?? "dark");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(probe);
    };
    probe();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) return;
    const root = panel.current;
    root?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <header
        ref={header}
        className={styles.top}
        data-theme={theme}
        data-hidden={hidden && !open ? "true" : undefined}
        onFocusCapture={() => setHidden(false)}
      >
        <div className={styles.group}>
          <button type="button" className={`${styles.sound}`} aria-pressed={soundOn} onClick={toggleSound}>
            <span className={styles.soundDot} data-on={soundOn} aria-hidden="true" />
            {soundOn ? t["ui.soundOn"] : t["ui.soundOff"]}
          </button>
          <span className={`${styles.sep}`} aria-hidden="true" />
          <LangSwitch locale={locale} hash={section} className={`${styles.langCompact}`} />
          <span className={`${styles.sep}`} aria-hidden="true" />
          <button
            ref={trigger}
            type="button"
            className={styles.indexButton}
            aria-expanded={open}
            aria-controls="site-index"
            onClick={() => setOpen(true)}
          >
            <span>{t["nav.index"]}</span>
            <span className={styles.bracket} aria-hidden="true">
              <span>[</span>
              <span className={styles.plus}>+</span>
              <span>]</span>
            </span>
          </button>
        </div>
      </header>

      <div
        id="site-index"
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={t["nav.index"]}
        data-open={open}
        hidden={!open}
      >
        <div className={styles.panelTop}>
          <span className="micro" aria-hidden="true">NØFORM / INDEX 01—08</span>
          <button type="button" className={styles.closeButton} onClick={() => close()} data-autofocus>
            {t["nav.close"]} <span aria-hidden="true">[ × ]</span>
          </button>
        </div>

        <div className={styles.panelBody}>
          <ol className={styles.list}>
            {ITEMS.map((item, i) => (
              <li key={item.id} style={{ "--i": i } as React.CSSProperties}>
                <a
                  href={`#${item.id}`}
                  className={styles.link}
                  aria-current={current === item.id ? "location" : undefined}
                  onClick={() => {
                    holdUntil.current = performance.now() + 900;
                    setHidden(false);
                    close(false);
                  }}
                  onMouseEnter={() => setPreview(item.media)}
                  onFocus={() => setPreview(item.media)}
                >
                  <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.label}>{t[item.key]}</span>
                  <span className={styles.rule} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
          <div className={styles.preview} aria-hidden="true">
            {ITEMS.filter((it) => it.media).map((it) => (
              <div key={it.id} className={styles.previewItem} data-active={preview === it.media}>
                <Img id={it.media as MediaId} alt="" sizes="30vw" />
              </div>
            ))}
            <span className="cross" style={{ left: 0, top: 0 }} />
            <span className="cross" style={{ right: 0, bottom: 0, left: "auto", translate: "50% 50%" }} />
          </div>
        </div>

        <div className={styles.panelFoot}>
          <LangSwitch locale={locale} hash={current} className={styles.langLarge} />
          <span className="micro" aria-hidden="true">COLLECTION 01 / 2026</span>
        </div>
      </div>
    </>
  );
}
