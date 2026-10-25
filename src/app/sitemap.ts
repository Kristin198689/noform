import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    alternates: { languages: { de: `${siteUrl}/de`, en: `${siteUrl}/en`, uk: `${siteUrl}/uk`, "x-default": `${siteUrl}/de` } },
  }));
}
