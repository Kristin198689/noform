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
  ["look-06", "photos/look-06-rear.png"], // replaces look-02 (unnatural leg angle) in the ring
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
  // Tiny blurred placeholder for opaque photos (never for alpha cut-outs: it would show a box).
  const lqip = hasAlpha
    ? undefined
    : `data:image/webp;base64,${(await input.clone().resize({ width: 20 }).blur(1.2).webp({ quality: 38 }).toBuffer()).toString("base64")}`;
  manifest[id] = { width, height, alpha: Boolean(hasAlpha), widths, ...(lqip ? { lqip } : {}) };
  console.log(`${id}: ${width}x${height} alpha=${hasAlpha} -> ${widths.join(", ")}`);
}

// Floating visor: the three renders normalised to one optical centre (alpha centroid)
// and one visible size (sqrt of alpha area), on a shared transparent canvas.
const FLOAT = ["visor-angle-01", "visor-angle-02", "visor-angle-03"];
const CANVAS = { w: 1800, h: 1200 }; // roomy, so tilted angles never clip
const stats = [];
for (const name of FLOAT) {
  const img = sharp(path.join(SRC, "products", `${name}.png`)).ensureAlpha();
  const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
  let n = 0, sx = 0, sy = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 24) { n++; sx += x; sy += y; }
    }
  stats.push({ name, img, cx: sx / n, cy: sy / n, size: Math.sqrt(n), w: info.width, h: info.height });
}
const target = Math.min(...stats.map((s) => s.size)) * 0.92;
// Angle 03 is shot from above: its long temples inflate the alpha area, so match it by lens width instead.
const LENS_FIX = [1, 1, 0.8];
for (const [i, st] of stats.entries()) {
  const k = (target / st.size) * (LENS_FIX[i] ?? 1);
  const w = Math.round(st.w * k), h = Math.round(st.h * k);
  const left = Math.round(CANVAS.w / 2 - st.cx * k), top = Math.round(CANVAS.h / 2 - st.cy * k);
  const scaled = await st.img.clone().resize({ width: w, height: h }).png().toBuffer();
  const canvas = sharp({ create: { width: CANVAS.w, height: CANVAS.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: scaled, left, top }]).png();
  const master = await canvas.toBuffer();
  const id = `visor-float-0${i + 1}`;
  for (const ww of [480, 960, 1536]) {
    const r = sharp(master).resize({ width: ww });
    await r.clone().avif({ quality: 60, effort: 6 }).toFile(path.join(OUT, `${id}-${ww}.avif`));
    await r.clone().webp({ quality: 82, alphaQuality: 92, effort: 6 }).toFile(path.join(OUT, `${id}-${ww}.webp`));
  }
  manifest[id] = { width: CANVAS.w, height: CANVAS.h, alpha: true, widths: [480, 960, 1536] };
  console.log(`${id}: scale ${k.toFixed(3)} centre ${st.cx.toFixed(0)},${st.cy.toFixed(0)}`);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
