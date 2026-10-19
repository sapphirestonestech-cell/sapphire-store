/**
 * Dev-only product images.
 *
 * The storefront is seeded with royalty-free stock photography of rings worn
 * on hands — Pexels photos (Pexels License: free for commercial use, no
 * attribution required; https://www.pexels.com/license/), downloaded into
 * `public/seed/rings/<slug>-<view>.jpg` and referenced by `scripts/seed.ts`.
 * Each photo's Pexels ID is recorded in `SEED_PHOTOS` below so provenance
 * stays next to the URLs (client-approved source, 2026-10-18).
 *
 * The self-drawn SVG illustrations from `npm run images` remain in the repo
 * as a fallback art direction but are no longer referenced by the seed.
 * Replace everything here with real product photography / Cloudinary uploads
 * when available (OPEN_QUESTIONS.md).
 *
 * The URL shape mirrors how Cloudinary URLs will look later, so swapping the
 * seed to real uploads is a data change, not a code change.
 */
export const SEED_IMAGE_DIR = "/seed/rings";

/**
 * Homepage hero imagery — seeded product covers (see `SEED_PHOTOS`).
 * Replaced by admin-managed featured imagery later.
 */
export const SEED_HERO_MAIN_URL = "/seed/rings/aurelia-solitaire-cover.jpg";
export const SEED_HERO_ACCENT_URL = "/seed/rings/amara-trilogy-cover.jpg";

export const SEED_IMAGE_VIEWS = [
  { key: "cover", label: "Cover" },
  { key: "left", label: "Left hand" },
  { key: "right", label: "Right hand" },
  { key: "detail", label: "Detail" },
] as const;

export type SeedImageView = (typeof SEED_IMAGE_VIEWS)[number]["key"];

export interface SeedImage {
  url: string;
  label: string;
  position: number;
}

/** One seeded stock photo: its Pexels ID (provenance) and gallery caption. */
export interface SeedPhoto {
  photoId: number;
  label: string;
}

/**
 * The seeded photo set — slug → view → Pexels photo. Captions describe what
 * each photo actually shows ("On the hand", "Close-up", …) rather than a
 * fixed left/right hand, because stock photos cannot guarantee handedness.
 */
export const SEED_PHOTOS: Record<string, Record<SeedImageView, SeedPhoto>> = {
  "aurelia-solitaire": {
    cover: { photoId: 9818318, label: "On the hand" },
    left: { photoId: 14509682, label: "On the hand" },
    right: { photoId: 19790297, label: "On the hand" },
    detail: { photoId: 18664252, label: "Close-up" },
  },
  "vera-halo-ring": {
    cover: { photoId: 3091637, label: "On the hand" },
    left: { photoId: 30381180, label: "On the hand" },
    right: { photoId: 14553371, label: "On the hand" },
    detail: { photoId: 33299100, label: "Close-up" },
  },
  "liora-twist-band": {
    cover: { photoId: 19139705, label: "On the hand" },
    left: { photoId: 15958822, label: "On the hand" },
    right: { photoId: 17232934, label: "On the hand" },
    detail: { photoId: 30639801, label: "Close-up" },
  },
  "nadia-stone-drop": {
    cover: { photoId: 20664465, label: "On the hand" },
    left: { photoId: 11139762, label: "On the hand" },
    right: { photoId: 13620299, label: "On both hands" },
    detail: { photoId: 39643917, label: "Close-up" },
  },
  "kofi-signet": {
    cover: { photoId: 8250149, label: "On the hand" },
    left: { photoId: 34809943, label: "On the hand" },
    right: { photoId: 35464673, label: "On both hands" },
    detail: { photoId: 15728030, label: "Close-up" },
  },
  "tobi-grooved-band": {
    cover: { photoId: 7260310, label: "On the hand" },
    left: { photoId: 27399481, label: "On the hand" },
    right: { photoId: 30268256, label: "On the hand" },
    detail: { photoId: 8433597, label: "Close-up" },
  },
  "sienna-pav-eternity": {
    cover: { photoId: 34576500, label: "On the hand" },
    left: { photoId: 38234106, label: "On the hand" },
    right: { photoId: 38630429, label: "On the hand" },
    detail: { photoId: 11961221, label: "On both hands" },
  },
  "amara-trilogy": {
    cover: { photoId: 33044590, label: "On both hands" },
    left: { photoId: 8032249, label: "Held in hand" },
    right: { photoId: 34997574, label: "On the hand" },
    detail: { photoId: 15960447, label: "Close-up" },
  },
};

export function seedImageUrls(slug: string): SeedImage[] {
  const photos = SEED_PHOTOS[slug];
  return SEED_IMAGE_VIEWS.map((view, index) => ({
    url: `${SEED_IMAGE_DIR}/${slug}-${view.key}.jpg`,
    label: photos?.[view.key].label ?? view.label,
    position: index + 1,
  }));
}

export type RingShape =
  | "solitaire"
  | "halo"
  | "twist"
  | "marquise"
  | "signet"
  | "grooved"
  | "eternity"
  | "trilogy";

export type Metal = "gold" | "rose" | "silver" | "steel";

export interface SeedRingArt {
  slug: string;
  shape: RingShape;
  metal: Metal;
}

/**
 * Art direction for the seeded rings, keyed by product slug. The generator
 * (`npm run images`) reads this; `scripts/seed.ts` derives the matching URLs
 * from the same slugs, so the images and the database never drift.
 */
export const SEED_RING_ART: SeedRingArt[] = [
  { slug: "aurelia-solitaire", shape: "solitaire", metal: "gold" },
  { slug: "vera-halo-ring", shape: "halo", metal: "gold" },
  { slug: "liora-twist-band", shape: "twist", metal: "rose" },
  { slug: "nadia-stone-drop", shape: "marquise", metal: "gold" },
  { slug: "kofi-signet", shape: "signet", metal: "silver" },
  { slug: "tobi-grooved-band", shape: "grooved", metal: "gold" },
  { slug: "sienna-pav-eternity", shape: "eternity", metal: "gold" },
  { slug: "amara-trilogy", shape: "trilogy", metal: "gold" },
];

export function seedRingArt(slug: string): SeedRingArt {
  return (
    SEED_RING_ART.find((art) => art.slug === slug) ?? {
      slug,
      shape: "solitaire",
      metal: "gold",
    }
  );
}
