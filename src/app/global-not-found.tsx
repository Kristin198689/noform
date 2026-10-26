import type { Metadata } from "next";
import Link from "next/link";
import { golos, museo, plex } from "./fonts";
import { locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { Wordmark } from "@/components/Wordmark";
import "./globals.css";
import styles from "./global-not-found.module.css";

export const metadata: Metadata = {
  title: "404 — NØFORM",
  robots: { index: false, follow: false },
};

/**
 * One 404 for every unmatched URL. It renders outside the [locale] layout, so it cannot know the
 * reader's language: it speaks all three and offers each start page.
 */
export default function GlobalNotFound() {
  return (
    <html lang="de" className={`${museo.variable} ${golos.variable} ${plex.variable}`}>
      <body className={styles.page}>
        <span className={styles.guide} style={{ top: "18%" }} aria-hidden="true" />
        <span className={styles.guide} style={{ top: "82%" }} aria-hidden="true" />
        <header className={styles.top}>
          <Link href="/de" className={styles.brand} aria-label="NØFORM">
            <Wordmark />
          </Link>
          <p className="micro">ERROR / 404</p>
        </header>
        <main className={styles.main}>
          <p className={`display ${styles.code}`} aria-hidden="true">
            4<span className={styles.o}>Ø</span>4
          </p>
          <ul className={styles.langs}>
            {locales.map((l) => {
              const t = getMessages(l);
              return (
                <li key={l} lang={l} className={styles.lang}>
                  <span className={`micro ${styles.tag}`}>{l.toUpperCase()}</span>
                  <div>
                    <h1 className={`display ${styles.title}`}>{t["notFound.title"]}</h1>
                    <p className={styles.text}>{t["notFound.text"]}</p>
                  </div>
                  <Link href={`/${l}`} hrefLang={l} className={`micro ${styles.home}`}>
                    {t["notFound.home"]} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </main>
        <p className={`micro ${styles.foot}`}>FIKTIVE MARKE / FICTIONAL BRAND / ВИГАДАНИЙ БРЕНД</p>
      </body>
    </html>
  );
}
