# NØFORM — project rules

Fictional streetwear concept site, portfolio piece by Volodina Web Studio. No shop, payments, accounts, forms, analytics or backend.

## Source of truth (in this order)
1. `NOFORM_Claude_Package/BRIEF_FOR_CLAUDE.md` + `src/messages/{de,en,uk}.json`
2. The eight approved layouts in `NOFORM_Claude_Package/references/` (composition only; never embed them)
3. `NOFORM_Claude_Package/spec/DECISION_HISTORY.md` (archive)

The approved brief always wins over general style advice from any skill. Keep the micro labels, thin grids, numbers, pointers, palette and typography exactly as designed.

## Skills for this project
- Use: `emil-design-eng`, `animation-performance`, `mobile-native`, `review-animations` (manual), Playwright for QA, Graphify when the structure grows, `seo-hreflang` at the end.
- Off here (`.claude/settings.json` → `skillOverrides`): `ui-ux-pro-max`, `design-taste-frontend`, marketing skills. Do not apply Taste or generate a new design system.
- Apply Emil's motion advice inside the existing stack: GSAP + ScrollTrigger only. Do not add Motion/Framer Motion.

## Implementation rules
- Next.js App Router + TypeScript strict, CSS Modules, routes `/de` (default) `/en` `/uk`.
- Fonts: local WOFF2 via `next/font/local` only; OFL licences stay in `src/fonts/*/OFL.txt`. No Google Fonts/CDN.
- Images: clean photos from `NOFORM_Claude_Package/assets`; web derivatives via `npm run images` → `public/media`. Never use `references/*.png` on the site.
- MuseoModerno has no Ukrainian Cyrillic: `:lang(uk)` headings use Golos Text 800.
- Numbers on the layouts are decorative codes; never present them as product measurements (Lab shows VOLUME 0–100 only).
- No invented studio URL, legal data, reviews or clients. `src/lib/site.ts` holds the TODOs.
- Commits/pushes on `feat/noform-site` at stage boundaries are allowed; no force push, no merge into `main` without approval, no deploy.
