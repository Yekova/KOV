import type { Brand } from "./brands";
import { GALLERY_SLOTS } from "@/components/studio/brandGallery/galleryLayout";

/** The stand KOV occupies in its own gallery.
 *
 *  Not a seeded row and not a mock. A row in `brand_gallery` is a tenant —
 *  someone whose name, mark and film are theirs and who is there for a
 *  period; KOV is the building. Keeping the house stand in code says that
 *  plainly, guarantees the room is never an empty showroom on the day the
 *  table is empty, and means the first thing a visitor walks up to is the
 *  worked example of what a stand is.
 *
 *  Everything here is KOV's own: its mark from the brand folder, its own
 *  render on the panel, its own site on the button, and a description
 *  written from copy the site already carries. Nothing is claimed about
 *  anybody else.
 *
 *  A real row with the slug `kov` overrides it — see fetchBrands. */
export const HOUSE_BRAND: Brand = {
  id: "kov-house",
  name: "KOV",
  slug: "kov",
  description:
    "KOV transforme les idées en expériences numériques. Cette galerie est notre propre salle : elle se parcourt à pied, et chaque emplacement y est une position construite — un socle, une lumière, un mur. Le stand devant vous est le nôtre, et il montre exactement ce qu'une marque occupe ici.",
  logoUrl: "/kov/brand/kov-wordmark-bone.png",
  coverUrl: "/studio/brands/kov-cover.webp",
  videoUrl: null,
  modelUrl: null,
  websiteUrl: "https://kov-agency.site",
  // The recess at the head of the room. The host stands where the room
  // points, which is also the position a visitor reaches last.
  position: GALLERY_SLOTS[7].position,
  rotationY: GALLERY_SLOTS[7].rotationY,
  scale: 1,
  tier: "immersive",
  isFeatured: true,
  isHouse: true,
};
