/**
 * Generate the development seed images:
 *   npm run images
 *
 * Writes one SVG illustration per product view into `public/seed/rings`, so the
 * storefront renders real image files instead of the glyph placeholder. These
 * are our own drawings (no stock photography — AGENTS.md §11) and are meant to
 * be replaced by the client's product photos / Cloudinary uploads.
 *
 * Idempotent: overwrites the files each run.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  SEED_IMAGE_DIR,
  SEED_IMAGE_VIEWS,
  SEED_RING_ART,
  type Metal,
  type RingShape,
} from "../src/lib/seed-images";

interface MetalPalette {
  light: string;
  mid: string;
  dark: string;
}

const METALS: Record<Metal, MetalPalette> = {
  gold: { light: "#F1DDA2", mid: "#C9A24B", dark: "#8A6A1F" },
  rose: { light: "#EFC7B4", mid: "#C68A6B", dark: "#9C6247" },
  silver: { light: "#EDF1F4", mid: "#B9C0C7", dark: "#7E878F" },
  steel: { light: "#E6EAEE", mid: "#AEB6BE", dark: "#6F777F" },
};

const SIZE = 800;
const HEIGHT = 1000;
const R = 150; // ring band radius

const METAL = "url(#metal)";

function band(radius: number, width: number): string {
  return `
    <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${METAL}" stroke-width="${width}"/>
    <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#ffffff" stroke-width="${Math.max(
      2,
      width * 0.16,
    )}" stroke-linecap="round" stroke-dasharray="26 400" stroke-dashoffset="18" opacity="0.5"/>`;
}

function roundGem(cx: number, cy: number, r: number, setting = 5): string {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r + setting}" fill="${METAL}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gem)"/>
    <path d="M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r}" stroke="#c7d6e2" stroke-width="1.4" opacity="0.65"/>
    <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.34}" r="${r * 0.2}" fill="#ffffff" opacity="0.85"/>`;
}

function stonesOnRing(count: number, size: number): string {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const t = (i / count) * Math.PI * 2;
    const cx = R * Math.sin(t);
    const cy = -R * Math.cos(t);
    out += roundGem(cx, cy, size, 3);
  }
  return out;
}

function shape(shapeName: RingShape): string {
  switch (shapeName) {
    case "solitaire":
      return `${band(R, 26)}${roundGem(0, -R, 54, 6)}`;

    case "halo": {
      let halo = "";
      for (let i = 0; i < 16; i += 1) {
        const t = (i / 16) * Math.PI * 2;
        halo += `<circle cx="${(60 * Math.sin(t)).toFixed(1)}" cy="${(
          -152 -
          76 * Math.cos(t)
        ).toFixed(1)}" r="5" fill="${METAL}"/>`;
      }
      return `${band(R, 20)}${halo}
        <ellipse cx="0" cy="-152" rx="42" ry="56" fill="${METAL}"/>
        <ellipse cx="0" cy="-152" rx="34" ry="48" fill="url(#gem)"/>
        <ellipse cx="-12" cy="-168" rx="9" ry="14" fill="#ffffff" opacity="0.8"/>`;
    }

    case "twist":
      return `
        <circle cx="0" cy="-16" r="136" fill="none" stroke="${METAL}" stroke-width="22"/>
        <circle cx="0" cy="-16" r="136" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="20 320" stroke-dashoffset="30" opacity="0.5"/>
        <ellipse cx="16" cy="16" rx="136" ry="136" fill="none" stroke="url(#metalDark)" stroke-width="20"/>`;

    case "marquise":
      return `${band(R, 18)}
        <path d="M0 -96 Q34 -152 0 -208 Q-34 -152 0 -96 Z" fill="${METAL}"/>
        <path d="M0 -104 Q26 -152 0 -200 Q-26 -152 0 -104 Z" fill="url(#gem)"/>
        <path d="M0 -200 V-104" stroke="#c7d6e2" stroke-width="1.4" opacity="0.6"/>`;

    case "signet":
      return `${band(R, 30)}
        <rect x="-74" y="-198" width="148" height="106" rx="52" fill="${METAL}"/>
        <ellipse cx="0" cy="-148" rx="40" ry="30" fill="#211d19" opacity="0.12"/>
        <circle cx="0" cy="-148" r="16" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4"/>`;

    case "grooved":
      return `${band(R, 46)}
        <circle cx="0" cy="0" r="${R}" fill="none" stroke="url(#metalDark)" stroke-width="8" opacity="0.85"/>`;

    case "eternity":
      return `${band(R, 30)}${stonesOnRing(22, 9)}`;

    case "trilogy":
      return `${band(R, 22)}
        ${roundGem(-60, -132, 30, 4)}
        ${roundGem(60, -132, 30, 4)}
        ${roundGem(0, -R, 48, 6)}`;
  }
}

function render(slug: string, shapeName: RingShape, metal: Metal, view: string): string {
  const m = METALS[metal];
  const finger =
    view === "left" || view === "right"
      ? `<rect x="-66" y="-370" width="132" height="740" rx="66" fill="url(#skin)"/>`
      : "";
  const ringTransform =
    view === "detail"
      ? `translate(${SIZE / 2} 600) scale(1.7)`
      : view === "left"
        ? `translate(${SIZE / 2} 520) rotate(-13)`
        : view === "right"
          ? `translate(${SIZE / 2} 520) rotate(13)`
          : `translate(${SIZE / 2} 520)`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${HEIGHT}" width="${SIZE}" height="${HEIGHT}" role="img" aria-label="${slug} ${view}">
  <title>${slug} — ${view}</title>
  <defs>
    <radialGradient id="bg" cx="50%" cy="36%" r="85%">
      <stop offset="0" stop-color="#fdfbf7"/>
      <stop offset="1" stop-color="#ebe3d6"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m.light}"/>
      <stop offset="0.45" stop-color="${m.mid}"/>
      <stop offset="1" stop-color="${m.dark}"/>
    </linearGradient>
    <linearGradient id="metalDark" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${m.mid}"/>
      <stop offset="1" stop-color="${m.dark}"/>
    </linearGradient>
    <linearGradient id="gem" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#eaf1f6"/>
      <stop offset="1" stop-color="#c9d7e2"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ecdcc9"/>
      <stop offset="0.5" stop-color="#f3e7d8"/>
      <stop offset="1" stop-color="#e0cdb5"/>
    </linearGradient>
    <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#211d19" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#211d19" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${HEIGHT}" fill="url(#bg)"/>
  <ellipse cx="${SIZE / 2}" cy="${view === "detail" ? 880 : 720}" rx="240" ry="52" fill="url(#shadow)"/>
  ${finger}
  <g transform="${ringTransform}" stroke-linejoin="round" stroke-linecap="round">
    ${shape(shapeName)}
  </g>
</svg>
`;
}

async function main() {
  const dir = join(
    process.cwd(),
    "public",
    ...SEED_IMAGE_DIR.split("/").filter(Boolean),
  );
  await mkdir(dir, { recursive: true });

  let count = 0;
  for (const art of SEED_RING_ART) {
    for (const view of SEED_IMAGE_VIEWS) {
      const svg = render(art.slug, art.shape, art.metal, view.key);
      await writeFile(join(dir, `${art.slug}-${view.key}.svg`), svg, "utf8");
      count += 1;
    }
  }
  console.log(`Wrote ${count} images to public${SEED_IMAGE_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
