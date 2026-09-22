import type { Brand } from "./brands";
import { GALLERY_SLOTS } from "@/components/studio/brandGallery/galleryLayout";

/** Where the host stands: the centre niche of the far wall on the ground
 *  floor, which is what a visitor is looking at the moment they step
 *  through the portal. */
const HOUSE_SLOT = GALLERY_SLOTS.find((slot) => slot.id === "n0-north-c") ?? GALLERY_SLOTS[0];

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
  slotId: HOUSE_SLOT.id,
  name: "KOV",
  slug: "kov",
  description:
    "KOV transforme les idées en expériences numériques. Cette galerie est notre propre salle : elle se parcourt à pied, et chaque emplacement y est une position construite — un socle, une lumière, un mur. Le stand devant vous est le nôtre, et il montre exactement ce qu'une marque occupe ici.",
  logoUrl: "/kov/brand/kov-wordmark-bone.png",
  coverUrl: "/studio/brands/kov-cover.webp",
  videoUrl: null,
  modelUrl: null,
  websiteUrl: "https://kov-agency.site",
  // The niche on the far wall, dead ahead of the portal across the void.
  // Addressed by id rather than by index: the building has two storeys and
  // seventeen addresses now, and an index into that list is a number that
  // means nothing the day one is inserted.
  position: HOUSE_SLOT.position,
  rotationY: HOUSE_SLOT.rotationY,
  scale: 1,
  tier: "immersive",
  isFeatured: true,
  isHouse: true,
};
