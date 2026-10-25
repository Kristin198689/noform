import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { golos, museo, plex } from "../fonts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { siteUrl } from "@/lib/site";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  const title = `NØFORM — ${t["lookbook.title"].replace(/\.$/, "")}`;
  const description = `${t["end.subtitle"]} ${t["about.disclaimer"]}.`;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { de: "/de", en: "/en", uk: "/uk", "x-default": "/de" },
    },
    openGraph: {
      type: "website",
      siteName: "NØFORM",
      title,
      description,
      locale: { de: "de_DE", en: "en_GB", uk: "uk_UA" }[locale],
      url: `/${locale}`,
      images: [{ url: "/media/hero-1536.webp", width: 1536, height: 1024, alt: t["alt.hero"] }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/media/hero-1536.webp"] },
    icons: { icon: "/icon.svg" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale satisfies Locale} className={`${museo.variable} ${golos.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
