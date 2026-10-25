import { notFound } from "next/navigation";
import { Chrome } from "@/components/chrome/Chrome";
import { SiteProvider } from "@/components/SiteProvider";
import { Hero } from "@/components/sections/Hero";
import { PauseA } from "@/components/sections/PauseA";
import { Lookbook } from "@/components/sections/Lookbook";
import { About } from "@/components/sections/About";
import { PauseB } from "@/components/sections/PauseB";
import { Visor } from "@/components/sections/Visor";
import { DesignCode } from "@/components/sections/DesignCode";
import { Scanner } from "@/components/sections/Scanner";
import { FormLab } from "@/components/sections/FormLab";
import { Finale } from "@/components/sections/Finale";
import { isLocale } from "@/i18n/config";
import { getMessages, pick } from "@/i18n/messages";

// Order from the brief: 01 HERO → pause A → 02 → 03 → pause B → 04 → 05 → 06 → 07 → 08.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <SiteProvider>
      <a className="skip-link" href="#content">
        {t["ui.skip"]}
      </a>
      <Chrome
        locale={locale}
        t={pick(t, [
          "nav.index",
          "nav.close",
          "nav.hero",
          "nav.lookbook",
          "nav.about",
          "nav.visor",
          "nav.code",
          "nav.scanner",
          "nav.lab",
          "nav.end",
          "ui.soundOff",
          "ui.soundOn",
        ])}
      />
      <main id="content" tabIndex={-1}>
        <Hero t={pick(t, ["hero.tagline", "hero.independent", "hero.collection", "hero.left", "hero.start", "hero.right", "alt.hero"])} />
        <PauseA t={pick(t, ["pauseA.title", "pauseA.caption", "hero.independent"])} />
        <Lookbook
          t={pick(t, [
            "lookbook.title",
            "lookbook.subtitle",
            "lookbook.section",
            "lookbook.look",
            "lookbook.frame",
            "ui.scroll",
            "ui.drag",
            "alt.low",
            "alt.back",
            "alt.overhead",
            "alt.crouch",
            "alt.stride",
          ])}
        />
        <About
          t={pick(t, ["about.title", "about.eyebrow", "about.p1", "about.p2", "about.p3", "about.disclaimer", "hero.tagline", "alt.low"])}
        />
        <PauseB t={pick(t, ["pauseB.title"])} />
        <Visor
          t={pick(t, [
            "visor.section",
            "visor.title",
            "visor.badge",
            "visor.shield",
            "visor.temples",
            "visor.curve",
            "visor.statement",
            "visor.micro",
            "visor.material",
            "alt.visor",
          ])}
        />
        <DesignCode
          t={pick(t, [
            "code.title",
            "code.volume",
            "code.curve",
            "code.proportion",
            "code.p1",
            "code.p2",
            "code.statement",
            "lab.shoulder",
            "lab.volume",
            "lab.silhouette",
            "alt.overhead",
          ])}
        />
        <Scanner
          locale={locale}
          t={pick(t, ["scanner.title", "scanner.word1", "scanner.word2", "scanner.word3", "scanner.statement", "scanner.scan"])}
        />
        <FormLab
          t={pick(t, [
            "lab.title",
            "lab.heading",
            "lab.description",
            "lab.regular",
            "lab.oversized",
            "lab.drag",
            "lab.volume",
            "lab.shoulder",
            "lab.sleeve",
            "lab.silhouette",
            "lab.note",
          ])}
        />
        <Finale
          locale={locale}
          t={pick(t, ["end.heading", "end.subtitle", "end.concept", "end.credit", "end.fiction", "ui.top", "legal.imprint", "legal.privacy"])}
        />
      </main>
    </SiteProvider>
  );
}
