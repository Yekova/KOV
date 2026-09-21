import { supabase } from "@/lib/supabase";

// What a stand in the Brand Gallery is, and how one is fetched.
//
// The room's architecture is geometry in the code. A brand only says which
// of the room's positions it occupies and what it shows there — so the
// gallery is never "a list of sponsors rendered in 3D", it is a building
// with tenants.

/** What a stand is allowed to show. A capability, not a price: there is no
 *  tariff yet, and a column for one would be inventing the offer. */
export type BrandTier = "presence" | "showcase" | "immersive" | "exclusive";

export interface Brand {
  id: string;
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
}

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  video_url: string | null;
  model_url: string | null;
  website_url: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  scale: number;
  tier: string;
  is_featured: boolean;
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

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: safeAsset(row.logo_url),
    coverUrl: safeAsset(row.cover_url),
    videoUrl: safeAsset(row.video_url),
    modelUrl: safeAsset(row.model_url),
    websiteUrl: safeLink(row.website_url),
    position: [row.position_x, row.position_y, row.position_z],
    rotationY: row.rotation_y,
    scale: row.scale,
    tier: TIERS.includes(row.tier as BrandTier) ? (row.tier as BrandTier) : "presence",
    isFeatured: row.is_featured,
  };
}

/** The gallery's occupants.
 *
 *  The status and date filtering is in the row-level policy, not here: a
 *  draft or an expired stand never leaves the database, so there is no
 *  client-side filter to forget. Returns an empty list on any failure —
 *  a gallery with no tenants is a room, and a room is still worth walking
 *  through. */
export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brand_gallery")
    .select(
      "id,name,slug,description,logo_url,cover_url,video_url,model_url,website_url,position_x,position_y,position_z,rotation_y,scale,tier,is_featured"
    )
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as BrandRow[]).map(toBrand);
}
