import { Img } from "@/components/Img";
import { Wordmark } from "@/components/Wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./Hero.module.css";

type HeroStrings = Pick<
  Messages,
  "hero.tagline" | "hero.independent" | "hero.collection" | "hero.left" | "hero.start" | "hero.right" | "alt.hero"
>;

/** Splits "A. B." micro copy into its two approved lines. */
function lines(text: string) {
  const parts = text.match(/[^.]+\.?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  if (parts.length > 1) return parts;
  // "FROM THE EVERYDAY TO THE UNEXPECTED" has no full stop: break before the last three words.
  const words = text.split(" ");
  return words.length > 3 ? [words.slice(0, -3).join(" "), words.slice(-3).join(" ")] : [text];
}

export function Hero({ t }: { t: HeroStrings }) {
  return (
    <section id="hero" data-section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.media}>
        <Img id="hero" alt={t["alt.hero"]} sizes="100vw" priority className={styles.photo} />
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.brand}>
        <span className={`capsule ${styles.origin}`} aria-hidden="true">ORIGIN</span>
        <h1 id="hero-title" className={styles.title}>
          <Wordmark className={styles.wordmark} label="NØFORM" />
        </h1>

        <p className={`micro ${styles.left}`}>
          {lines(t["hero.left"]).map((l) => (
            <span key={l}>{l}</span>
          ))}
          <span className={styles.leftRule} aria-hidden="true" />
        </p>

        <div className={styles.under}>
          <p className={`micro ${styles.start}`}>
            {lines(t["hero.start"]).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <p className={`micro ${styles.independent}`}>
            {t["hero.independent"]}
            <span className={styles.underline} aria-hidden="true" />
          </p>
          <p className={`micro ${styles.right}`}>
            {lines(t["hero.right"]).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
        </div>
      </div>

      <p className={`micro ${styles.tagline}`}>
        <span className={styles.tagRule} aria-hidden="true" />
        {t["hero.tagline"]}
        <span className={styles.tagRule} aria-hidden="true" />
      </p>

      <div className={styles.collection}>
        <span className={styles.rule} aria-hidden="true" />
        <p className="micro">{t["hero.collection"]}</p>
        <span className={styles.rule} aria-hidden="true" />
      </div>
    </section>
  );
}
