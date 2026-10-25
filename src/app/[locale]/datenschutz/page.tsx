import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return {
    title: `NØFORM — ${t["legal.privacy"]}`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${locale}/datenschutz`,
      languages: { de: "/de/datenschutz", en: "/en/datenschutz", uk: "/uk/datenschutz", "x-default": "/de/datenschutz" },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} kind="datenschutz" />;
}
