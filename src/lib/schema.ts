import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { siteUrl, studioUrl } from "@/lib/site";

/**
 * Schema.org for the concept site: the site, this language's page and the creative work it presents —
 * a fictional brand, made by Volodina Web Studio. Only facts the site itself states; no invented data.
 */
export function conceptJsonLd(locale: Locale): string {
  const t = getMessages(locale);
  const base = siteUrl.replace(/\/$/, "");
  const url = `${base}/${locale}`;
  const studio = { "@type": "Organization", name: "Volodina Web Studio", ...(studioUrl ? { url: studioUrl } : {}) };
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: "NØFORM",
        inLanguage: ["de", "en", "uk"],
        creator: studio,
      },
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: `NØFORM — ${t["lookbook.title"].replace(/\.$/, "")}`,
        description: t["end.subtitle"],
        inLanguage: locale,
        isPartOf: { "@id": `${base}/#website` },
        primaryImageOfPage: `${base}/media/og-1200x630.jpg`,
        mainEntity: { "@id": `${base}/#concept` },
      },
      {
        "@type": "CreativeWork",
        "@id": `${base}/#concept`,
        name: "NØFORM",
        alternateName: t["end.fiction"],
        description: `${t["end.subtitle"]} ${t["about.disclaimer"]}.`,
        genre: "Concept website / fictional fashion brand",
        dateCreated: "2026",
        image: `${base}/media/og-1200x630.jpg`,
        creator: studio,
      },
    ],
  };
  // `<` escaped so the JSON can never close the script element
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
