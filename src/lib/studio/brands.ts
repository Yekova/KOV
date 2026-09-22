import { supabase } from "@/lib/supabase";
import { GALLERY_SLOTS } from "@/components/studio/brandGallery/galleryLayout";
import { HOUSE_BRAND } from "./houseBrand";

// What a stand in the Brand Gallery is, and how one is fetched.
//
// The room's architecture is geometry in the code. A brand only says which
// of the room's positions it occupies and what it shows there — so the
// gallery is never "a list of sponsors rendered in 3D", it is a building
// with tenants.

/** What a stand is allowed to show. A capability, not a price: there is no
 *  tariff yet, and a column for one would be inventing the offer. It is
 *  read by the room, never printed at a visitor — a word like "presence"
 *  on someone's stand reads as a rank whatever it was meant as. */
export type BrandTier = "presence" | "showcase" | "immersive" | "exclusive";

export interface Brand {
  id: string;
  /** The address this stand occupies, e.g. "n1-north-c". The row names an
   *  address and nothing more: where that address is, is geometry in the
   *  code, which is what makes it impossible for a row to put a stand
   *  inside a wall. */
  slotId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  videoUrl: string | null;
  modelUrl: string | null;
  websiteUrl: string | null;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  tier: BrandTier;
  isFeatured: boolean;
  /** True for KOV's own stand, which is not a tenant. Never set from a
   *  row: the flag exists so the room can say "the studio" where it would
   *  otherwise print a tier at a visitor. */
  isHouse?: boolean;
}

interface GalleryRow {
  placement_id: string;
  slot_id: string;
  tier: string;
  is_featured: boolean;
  brand_id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  video_url: string | null;
  model_url: string | null;
}

const TIERS: readonly BrandTier[] = ["presence", "showcase", "immersive", "exclusive"];

/** Media has to come from somewhere this project controls.
 *
 *  Every asset in a row is a URL, and a URL in a row is data someone typed.
 *  Rendering one means the page fetches it, and an unchecked origin is an
 *  open door for anything from a tracking pixel to a swapped logo. Only
 *  same-origin paths and the project's own Supabase storage pass. */
function safeAsset(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/")) return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const supabaseHost = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    } catch {
      return null;
    }
  })();

  return parsed.host === supabaseHost || parsed.host === "kov-agency.site" ? parsed.toString() : null;
}

/** An outbound link, for the "Découvrir la marque" button.
 *
 *  Held to http(s) so a row can never smuggle in javascript: or data:. The
 *  host is deliberately not restricted — the whole point of a stand is that
 *  it sends someone to the brand's own site. */
function safeLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const SLOTS = new Map(GALLERY_SLOTS.map((slot) => [slot.id, slot]));

function toBrand(row: GalleryRow): Brand | null {
  // An address the building does not have. It cannot happen while
  // gallery_slots is seeded from the same list, but a row pointing at a
  // slot the code has since removed would otherwise be a stand at the
  // origin, floating in the middle of the void.
  const slot = SLOTS.get(row.slot_id);
  if (!slot) return null;

  return {
    // The placement, not the brand: the same brand can stand twice, and
    // each stand is its own thing in the room.
    id: row.placement_id,
    slotId: row.slot_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: safeAsset(row.logo_url),
    coverUrl: safeAsset(row.cover_url),
    videoUrl: safeAsset(row.video_url),
    modelUrl: safeAsset(row.model_url),
    websiteUrl: safeLink(row.website_url),
    position: slot.position,
    rotationY: slot.rotationY,
    scale: 1,
    tier: TIERS.includes(row.tier as BrandTier) ? (row.tier as BrandTier) : "presence",
    isFeatured: row.is_featured,
  };
}

/** The gallery's occupants: the house stand, then the tenants.
 *
 *  The status and date filtering is in the row-level policy, not here: a
 *  draft or an expired stand never leaves the database, so there is no
 *  client-side filter to forget. A failure degrades to the house stand
 *  alone — the room is still a room, and the one position that is not
 *  someone else's to lose is KOV's own. */
export async function fetchBrands(): Promise<Brand[]> {
  // public_gallery, not the tables under it. The view is the only thing
  // the anonymous key can reach, and it already answers the one question
  // the room has: what is standing here today. Draft placements, cancelled
  // ones, unpaid ones, the sponsor's account link and every commercial id
  // are not filtered out by this function — they are absent from what the
  // database exposes, which is the only kind of filtering that cannot be
  // forgotten.
  const { data, error } = await supabase
    .from("public_gallery")
    .select(
      "placement_id,slot_id,tier,is_featured,brand_id,name,slug,description,website_url,logo_url,cover_url,video_url,model_url"
    )
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  const tenants = error || !data ? [] : (data as GalleryRow[]).map(toBrand).filter((brand): brand is Brand => brand !== null);

  // The house stand, unless a real placement has taken its slug — which is
  // the escape hatch if KOV's own stand should ever be sold, moved or
  // edited like any other. The host comes first: it is the address the
  // portal looks at, and a list that opens on the building makes the rest
  // read as tenants.
  return tenants.some((brand) => brand.slug === HOUSE_BRAND.slug) ? tenants : [HOUSE_BRAND, ...tenants];
}
