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
    // noindex placeholder: kept out of the hreflang cluster until the real legal page exists
    alternates: { canonical: `/${locale}/datenschutz` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} kind="datenschutz" />;
}
