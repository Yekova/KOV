import "server-only";
import { supabase } from "@/lib/supabase";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import type { Project, ProjectStatus } from "@/data/projects";

// Reading the portfolio.
//
// One function, returning exactly the `Project` shape the ten consumers
// already render. That is the whole point of this layer: the type does not
// change, so moving the data from a file into a table is a change of where
// it comes from and of nothing else.
//
// The anonymous key, not the service role. The row-level policy already
// says only published rows are public, so a draft cannot leave the database
// even if this function forgot to filter — which is the only kind of
// filtering worth relying on.

const COLUMNS =
  "id,slug,reference,name,publication,kind,sort_order,category,tags,summary,tagline,detail,brief," +
  "narrative_problem,narrative_system,narrative_result,deliverables,location,href,case_study_href," +
  "image_path,screen_path,hover_logo_path,gallery_paths," +
  "video_path,video_poster_path,video_width,video_height,video_duration," +
  "metrics,testimonial_quote,testimonial_author,show_on_home,featured";

interface ShowcaseRow {
  id: string;
  slug: string;
  reference: string;
  name: string;
  publication: string;
  kind: string;
  sort_order: number | null;
  category: string;
  tags: string[] | null;
  summary: string | null;
  tagline: string | null;
  detail: string | null;
  brief: string | null;
  narrative_problem: string | null;
  narrative_system: string | null;
  narrative_result: string | null;
  deliverables: string[] | null;
  location: string | null;
  href: string | null;
  case_study_href: string | null;
  image_path: string | null;
  screen_path: string | null;
  hover_logo_path: string | null;
  gallery_paths: string[] | null;
  video_path: string | null;
  video_poster_path: string | null;
  video_width: number | null;
  video_height: number | null;
  video_duration: string | null;
  metrics: unknown;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  show_on_home: boolean;
  featured: boolean;
}

const KINDS: readonly ProjectStatus[] = ["live", "upcoming", "invitation"];

/** Where a stored asset actually lives.
 *
 *  Three cases, and the middle one is why `resolvePostImageUrl` could not be
 *  reused: a value starting with "/" is a file in `public/`, not a storage
 *  key, and resolving it as one would produce a URL to an object that does
 *  not exist. The six entries carried over from the old file are all of that
 *  kind; everything uploaded from the admin is a storage key. Both have to
 *  work at once, for as long as both exist. */
function asset(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return value;
  return getPublicAssetUrl(value);
}

function list(value: string[] | null): readonly string[] | null {
  return value && value.length > 0 ? value : null;
}

/** Measured figures, or nothing.
 *
 *  jsonb is whatever was written into it, so the shape is checked here
 *  rather than trusted. An entry missing either half is dropped: half a
 *  metric is a number with no unit or a unit with no number, and the tiles
 *  render neither. */
function metrics(value: unknown): readonly { value: string; label: string }[] | null {
  if (!Array.isArray(value)) return null;
  const rows = value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { value: v, label } = entry as { value?: unknown; label?: unknown };
    return typeof v === "string" && typeof label === "string" && v && label ? [{ value: v, label }] : [];
  });
  return rows.length > 0 ? rows : null;
}

export function toProject(row: ShowcaseRow): Project {
  // All three, or none. The type models the narrative as one object for the
  // stated reason that a half-filled one — a problem with no result — is the
  // patched-together rendering the whole file exists to make impossible. The
  // columns are nullable so a draft can be saved mid-thought; the rule is
  // enforced here, at the point the data becomes a `Project`.
  const narrative =
    row.narrative_problem && row.narrative_system && row.narrative_result
      ? {
          problem: row.narrative_problem,
          system: row.narrative_system,
          result: row.narrative_result,
        }
      : null;

  // A film needs its poster and its real dimensions as much as its file:
  // SheetVideo reserves the frame from width/height before anything loads,
  // and shows the poster until someone presses play. Missing any of the
  // four, there is no film to offer.
  const src = asset(row.video_path);
  const poster = asset(row.video_poster_path);
  const video =
    src && poster && row.video_width && row.video_height
      ? {
          src,
          poster,
          width: row.video_width,
          height: row.video_height,
          ...(row.video_duration ? { duration: row.video_duration } : {}),
        }
      : null;

  return {
    // The ordinal a visitor reads on the card. The uuid stays in the
    // database, where it belongs; `slug` below is what the DOM uses.
    id: row.reference,
    slug: row.slug,
    name: row.name,
    status: KINDS.includes(row.kind as ProjectStatus) ? (row.kind as ProjectStatus) : "upcoming",
    category: row.category,
    tags: row.tags ?? [],
    caseStudyHref: row.case_study_href,
    href: row.href,
    location: row.location,
    image: asset(row.image_path),
    screen: asset(row.screen_path),
    tagline: row.tagline,
    narrative,
    brief: row.brief,
    deliverables: list(row.deliverables),
    hoverLogo: asset(row.hover_logo_path),
    gallery: list(row.gallery_paths?.map((path) => asset(path)).filter((v): v is string => v !== null) ?? null),
    metrics: metrics(row.metrics),
    testimonial:
      row.testimonial_quote && row.testimonial_author
        ? { quote: row.testimonial_quote, author: row.testimonial_author }
        : null,
    video,
    summary: row.summary,
    detail: row.detail,
    showOnHome: row.show_on_home,
    featured: row.featured,
  };
}

/** Every published project, in the order the admin put them in.
 *
 *  Returns an empty list on failure rather than throwing. A portfolio page
 *  that renders its header and no cards is a page with a problem; a page
 *  that throws is a five-hundred. */
export async function fetchShowcaseProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("showcase_projects")
    .select(COLUMNS)
    .eq("publication", "published")
    // nullsFirst: false so a row that has never been reordered sorts after
    // the ones that have, rather than jumping to the top of the page.
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("reference", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as ShowcaseRow[]).map(toProject);
}
