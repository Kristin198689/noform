import Link from "next/link";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { Wordmark } from "@/components/Wordmark";
import styles from "./LegalPage.module.css";

type Kind = "impressum" | "datenschutz";

// Placeholder notice only. The real operator data must come from Volodina Web Studio
// and be checked against the actual hosting before any public launch — nothing is invented here.
const NOTICE: Record<Locale, { todo: string; body: string; back: string }> = {
  de: {
    todo: "TODO vor der Veröffentlichung",
    body: "Die Angaben des tatsächlichen Betreibers (Volodina Web Studio) werden vor dem öffentlichen Start ergänzt und mit Hosting und eingesetzten Diensten abgeglichen. Diese Seite enthält bewusst noch keine erfundenen Daten.",
    back: "Zurück",
  },
  en: {
    todo: "TODO before publication",
    body: "The details of the actual operator (Volodina Web Studio) will be added before the public launch and checked against the hosting and services in use. This page intentionally contains no invented data yet.",
    back: "Back",
  },
  uk: {
    todo: "TODO перед публікацією",
    body: "Дані фактичного оператора (Volodina Web Studio) буде додано перед публічним запуском і звірено з хостингом та сервісами, що використовуються. Ця сторінка свідомо ще не містить вигаданих даних.",
    back: "Назад",
  },
};

export function LegalPage({ locale, kind }: { locale: Locale; kind: Kind }) {
  const t = getMessages(locale);
  const n = NOTICE[locale];
  const title = kind === "impressum" ? t["legal.imprint"] : t["legal.privacy"];

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <Link href={`/${locale}`} className={styles.home} aria-label="NØFORM">
          <Wordmark className={styles.mark} />
        </Link>
        <nav aria-label="Language" className={`micro ${styles.langs}`}>
          {locales.map((l) => (
            <a key={l} href={`/${l}/${kind}`} hrefLang={l} lang={l} aria-current={l === locale ? "true" : undefined}>
              {localeLabels[l]}
            </a>
          ))}
        </nav>
      </header>
      <h1 className={`display ${styles.title}`}>{title}</h1>
      <p className={`micro ${styles.todo}`}>{n.todo}</p>
      <p className={`reading ${styles.body}`}>{n.body}</p>
      <p className={`micro ${styles.fiction}`}>{t["about.disclaimer"]}</p>
      <Link href={`/${locale}#end`} className={`micro ${styles.back}`}>
        ← {n.back}
      </Link>
    </main>
  );
}
