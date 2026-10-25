// Builds web derivatives (AVIF + WebP) from the PNG masters in the handoff package.
// Masters stay untouched; alpha is preserved for product cut-outs.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "NOFORM_Claude_Package/assets");
const OUT = path.join(ROOT, "public/media");
const MANIFEST = path.join(ROOT, "src/lib/media.json");

const SOURCES = [
  ["hero", "photos/hero-clean.png"],
  ["look-01", "photos/look-01-low-angle.png"],
  ["look-02", "photos/look-02-back.png"],
  ["look-03", "photos/look-03-overhead.png"],
  ["look-04", "photos/look-04-crouch.png"],
  ["look-05", "photos/look-05-stride.png"],
  ["visor-front", "photos/visor-front-clean.png"],
  ["visor-01", "products/visor-angle-01.png"],
  ["visor-02", "products/visor-angle-02.png"],
  ["visor-03", "products/visor-angle-03.png"],
  ["hoodie", "products/hoodie-cutout.png"],
  ["cargo", "products/cargo-cutout.png"],
];
const WIDTHS = [480, 960, 1536];

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const [id, rel] of SOURCES) {
  const input = sharp(path.join(SRC, rel));
  const { width, height, hasAlpha } = await input.metadata();
  const widths = [...WIDTHS.filter((w) => w < width), width];
  for (const w of widths) {
    const resized = input.clone().resize({ width: w });
    await resized.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(OUT, `${id}-${w}.avif`));
    await resized.clone().webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(path.join(OUT, `${id}-${w}.webp`));
  }
  manifest[id] = { width, height, alpha: Boolean(hasAlpha), widths };
  console.log(`${id}: ${width}x${height} alpha=${hasAlpha} -> ${widths.join(", ")}`);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
