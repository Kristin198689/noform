import { notFound } from "next/navigation";
import { Chrome } from "@/components/chrome/Chrome";
import { SiteProvider } from "@/components/SiteProvider";
import { ScenePreloader } from "@/components/ScenePreloader";
import { MotionDirector } from "@/components/MotionDirector";
import { Hero } from "@/components/sections/Hero";
import { PauseA } from "@/components/sections/PauseA";
import { Lookbook } from "@/components/sections/Lookbook";
import { About } from "@/components/sections/About";
import { PauseB } from "@/components/sections/PauseB";
import { Tunnel } from "@/components/sections/Tunnel";
import { Visor } from "@/components/sections/Visor";
import { DesignCode } from "@/components/sections/DesignCode";
import { Scanner } from "@/components/sections/Scanner";
import { FormLab } from "@/components/sections/FormLab";
import { Finale } from "@/components/sections/Finale";
import { BeyondFrame } from "@/components/sections/BeyondFrame";
import { LettersRing } from "@/components/studies/LettersRing";
import { HelixArchive } from "@/components/studies/HelixArchive";
import { SphereLooks } from "@/components/studies/SphereLooks";
import { DepthFlight } from "@/components/studies/DepthFlight";
import { isLocale } from "@/i18n/config";
import { getMessages, pick } from "@/i18n/messages";
import { conceptJsonLd } from "@/lib/schema";

// Order from the brief: 01 HERO → pause A → 02 → 03 → pause B → 04 → 05 → 06 → 07 → 08,
// with the letters ring after the hero, the depth flight between 02 and 03 and the helix archive between 03 and pause B.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <SiteProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: conceptJsonLd(locale) }} />
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
        <LettersRing t={pick(t, ["study1.label", "study1.caption", "study.hintTurn"])} />
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
        <DepthFlight t={pick(t, ["study4.label", "study4.hint", "study4.foot", "study4.depth"])} />
        <About
          t={pick(t, ["about.title", "about.eyebrow", "about.p1", "about.p2", "about.p3", "about.disclaimer", "hero.tagline", "alt.low"])}
        />
        <HelixArchive t={pick(t, ["study2.label", "study2.hint", "study2.foot", "study2.frame", "study2.mosaic"])} />
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
        <Tunnel t={pick(t, ["tunnel.title"])} />
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
            "lab.assembled",
          ])}
        />
        {/* Review stage: candidate scenes, to be placed between sections after review. */}
        <BeyondFrame
          t={pick(t, [
            "alt.portrait",
            "alt.glass",
            "beyond.title",
            "beyond.frame1",
            "beyond.frame2",
            "beyond.stage1",
            "beyond.stage2",
            "beyond.stage3",
            "beyond.stage4",
            "beyond.stage5",
          ])}
        />
        <SphereLooks t={pick(t, ["study3.label", "study3.foot", "study3.yaw", "study3.collapsed", "study.hintTurn"])} />
        <Finale
          locale={locale}
          t={pick(t, ["end.heading", "end.subtitle", "end.concept", "end.credit", "end.fiction", "ui.top", "legal.imprint", "legal.privacy"])}
        />
      </main>
      <ScenePreloader />
      <MotionDirector />
    </SiteProvider>
  );
}
