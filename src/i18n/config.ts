export const locales = ["de", "en", "uk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export const localeLabels: Record<Locale, string> = { de: "DE", en: "EN", uk: "UK" };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
