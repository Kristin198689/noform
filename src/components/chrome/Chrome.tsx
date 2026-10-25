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
  { id: "about", key: "nav.about", media: "look-02" },
  { id: "visor", key: "nav.visor", media: "visor-front" },
  { id: "code", key: "nav.code", media: "look-03" },
  { id: "scanner", key: "nav.scanner", media: "look-04" },
  { id: "lab", key: "nav.lab" },
  { id: "end", key: "nav.end" },
];

/** Section ids that belong to an index entry (pauses map to the section before them). */
const SECTION_FOR: Record<string, string> = { reset: "hero", perspective: "about" };

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
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const current = SECTION_FOR[section] ?? section;

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
      <div className={styles.top}>
        <LangSwitch locale={locale} hash={section} className={styles.langCompact} />
        <button
          ref={trigger}
          type="button"
          className={styles.indexButton}
          aria-expanded={open}
          aria-controls="site-index"
          onClick={() => setOpen(true)}
        >
          {t["nav.index"]} <span aria-hidden="true">[ + ]</span>
        </button>
      </div>

      <button
        type="button"
        className={styles.sound}
        aria-pressed={soundOn}
        onClick={toggleSound}
      >
        <span className={styles.soundDot} data-on={soundOn} aria-hidden="true" />
        {soundOn ? t["ui.soundOn"] : t["ui.soundOff"]}
      </button>

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
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={styles.link}
                  aria-current={current === item.id ? "location" : undefined}
                  onClick={() => close(false)}
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
