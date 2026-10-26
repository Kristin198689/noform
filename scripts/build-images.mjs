// Builds web derivatives (AVIF + WebP) from the PNG masters in the handoff package.
// Masters stay untouched; alpha is preserved for product cut-outs.
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  ["beyond-portrait", "photos/Чорно-білий портрет у сріблястому візорі.png"], // BEYOND THE FRAME, frame 01
  ["beyond-glass", "photos/Монохромна мода крізь скляну підлогу.png"], // BEYOND THE FRAME, frame 02
];
const WIDTHS = [480, 960, 1536];

// `npm run images -- id1 id2` rebuilds only those ids and keeps the rest of the manifest
const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const manifest = only.length ? JSON.parse(await readFile(MANIFEST, "utf8")) : {};

for (const [id, rel] of SOURCES.filter(([id]) => !only.length || only.includes(id))) {
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

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

// Social preview: JPG 1200 × 630 (what every platform shows reliably), the hero cropped to the face,
// a soft shade on the left and the approved wordmark (the real path, no font rendering).
if (!only.length || only.includes("og")) {
  const wordmark = await readFile(path.join(SRC, "noform-wordmark.svg"), "utf8");
  const d = wordmark.match(/\sd="([^"]+)"/)?.[1];
  if (!d) throw new Error("wordmark path not found");
  const [W, H] = [1200, 630];
  const overlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stop-color="#080808" stop-opacity="0"/>
        <stop offset="1" stop-color="#080808" stop-opacity="0.78"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#s)"/>
      <svg x="64" y="452" width="560" height="${Math.round((560 * 756) / 4697)}" viewBox="40 222 4697 756"><path d="${d}" fill="#f6f5f2"/></svg>
    </svg>`,
  );
  await sharp(path.join(SRC, "photos/hero-clean.png"))
    .resize({ width: W, height: H, fit: "cover", position: "attention" })
    .composite([{ input: overlay }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, "og-1200x630.jpg"));
  console.log("og: 1200x630 jpg");
}
