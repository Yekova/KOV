"use server";

import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidateShowcase } from "@/lib/revalidateShowcase";
import { PROJECTS } from "@/data/projects";
import { showcaseInputSchema, type ShowcaseInput } from "./schema";

// Every action re-checks requireAdmin() even though src/proxy.ts already
// gates /admin — defense in depth, the same convention the rest of the admin
// follows. Expected failures return { error } instead of throwing: Next 16
// redacts thrown Server Action messages in production and replaces them with
// a generic minified React error, so a thrown message never reaches anyone.

const BUCKET = "portal-assets";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const COLUMNS =
  "id,slug,reference,name,publication,kind,published_at,sort_order,category,tags,summary,tagline," +
  "detail,brief,narrative_problem,narrative_system,narrative_result,deliverables,location,href," +
  "case_study_href,image_path,screen_path,hover_logo_path,gallery_paths,video_path,video_poster_path," +
  "video_width,video_height,video_duration,metrics,testimonial_quote,testimonial_author," +
  "show_on_home,featured,updated_at";

export type ShowcaseRow = ShowcaseInput & {
  id: string;
  sortOrder: number | null;
  updatedAt: string;
};

interface DbRow {
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
  updated_at: string;
}

function toRow(row: DbRow): ShowcaseRow {
  return {
    id: row.id,
    slug: row.slug,
    reference: row.reference,
    name: row.name,
    publication: row.publication === "published" ? "published" : "draft",
    kind: row.kind === "live" || row.kind === "invitation" ? row.kind : "upcoming",
    sortOrder: row.sort_order,
    category: row.category,
    tags: row.tags ?? [],
    summary: row.summary ?? "",
    tagline: row.tagline ?? "",
    detail: row.detail ?? "",
    brief: row.brief ?? "",
    narrativeProblem: row.narrative_problem ?? "",
    narrativeSystem: row.narrative_system ?? "",
    narrativeResult: row.narrative_result ?? "",
    deliverables: row.deliverables ?? [],
    location: row.location ?? "",
    href: row.href ?? "",
    caseStudyHref: row.case_study_href ?? "",
    image: row.image_path ?? "",
    screen: row.screen_path ?? "",
    hoverLogo: row.hover_logo_path ?? "",
    gallery: row.gallery_paths ?? [],
    videoPath: row.video_path ?? "",
    videoPoster: row.video_poster_path ?? "",
    videoWidth: row.video_width,
    videoHeight: row.video_height,
    videoDuration: row.video_duration ?? "",
    metrics: Array.isArray(row.metrics) ? (row.metrics as { value: string; label: string }[]) : [],
    testimonialQuote: row.testimonial_quote ?? "",
    testimonialAuthor: row.testimonial_author ?? "",
    showOnHome: row.show_on_home,
    featured: row.featured,
    updatedAt: row.updated_at,
  };
}

/** Empty string means "no value", never the empty string itself. A column
 *  holding "" would make the read layer render an empty paragraph where it
 *  should render nothing at all. */
const orNull = (value: string | undefined) => (value && value.trim() ? value.trim() : null);

function toDbFields(input: ShowcaseInput, slug: string) {
  return {
    slug,
    reference: input.reference.trim(),
    name: input.name.trim(),
    publication: input.publication,
    kind: input.kind,
    category: input.category.trim(),
    tags: input.tags,
    summary: orNull(input.summary),
    tagline: orNull(input.tagline),
    detail: orNull(input.detail),
    brief: orNull(input.brief),
    narrative_problem: orNull(input.narrativeProblem),
    narrative_system: orNull(input.narrativeSystem),
    narrative_result: orNull(input.narrativeResult),
    deliverables: input.deliverables,
    location: orNull(input.location),
    href: orNull(input.href),
    case_study_href: orNull(input.caseStudyHref),
    image_path: orNull(input.image),
    screen_path: orNull(input.screen),
    hover_logo_path: orNull(input.hoverLogo),
    gallery_paths: input.gallery,
    video_path: orNull(input.videoPath),
    video_poster_path: orNull(input.videoPoster),
    video_width: input.videoWidth,
    video_height: input.videoHeight,
    video_duration: orNull(input.videoDuration),
    metrics: input.metrics,
    testimonial_quote: orNull(input.testimonialQuote),
    testimonial_author: orNull(input.testimonialAuthor),
    show_on_home: input.showOnHome,
    featured: input.featured,
  };
}

// Reads used as TanStack Query queryFns from the client — still gated by
// requireAdmin() and still going through supabaseAdmin server-side, the same
// security model as every other admin table here.

export async function getShowcaseProjects(): Promise<ShowcaseRow[]> {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("showcase_projects")
    .select(COLUMNS)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("reference", { ascending: true });
  return ((data ?? []) as unknown as DbRow[]).map(toRow);
}

export async function getShowcaseProjectById(id: string): Promise<ShowcaseRow | null> {
  await requireAdmin();
  const { data } = await supabaseAdmin.from("showcase_projects").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? toRow(data as unknown as DbRow) : null;
}

export async function createShowcaseProject(
  input: ShowcaseInput
): Promise<{ error: string | null; id?: string }> {
  await requireAdmin();
  const parsed = showcaseInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return { error: "Slug invalide." };

  const { data, error } = await supabaseAdmin
    .from("showcase_projects")
    .insert({
      ...toDbFields(parsed.data, slug),
      // Set on the way in when it is born published, and on the transition
      // otherwise — same rule as posts.published_at.
      published_at: parsed.data.publication === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par une autre réalisation." };
    return { error: "La création de la réalisation a échoué." };
  }

  revalidateShowcase();
  return { error: null, id: data?.id as string };
}

export async function updateShowcaseProject(id: string, input: ShowcaseInput): Promise<{ error: string | null }> {
  await requireAdmin();
  const parsed = showcaseInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { data: existing } = await supabaseAdmin
    .from("showcase_projects")
    .select("slug,publication,published_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "Réalisation introuvable." };

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return { error: "Slug invalide." };

  // Stamped once, on the draft to published transition, and never moved
  // afterwards: re-editing a live project is not republishing it.
  const becamePublished = existing.publication !== "published" && parsed.data.publication === "published";

  const { error } = await supabaseAdmin
    .from("showcase_projects")
    .update({
      ...toDbFields(parsed.data, slug),
      published_at: becamePublished ? new Date().toISOString() : existing.published_at,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par une autre réalisation." };
    return { error: "La mise à jour de la réalisation a échoué." };
  }

  revalidateShowcase();
  return { error: null };
}

/** The one-click toggle on a list row, the same narrow-update shape as
 *  setPostStatus / updateQuoteStatus. Throws rather than returning, because
 *  the list surfaces it through a toast. */
export async function setShowcasePublication(id: string, publication: "draft" | "published") {
  await requireAdmin();
  const { data: existing } = await supabaseAdmin
    .from("showcase_projects")
    .select("publication,published_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) throw new Error("Réalisation introuvable.");

  const becamePublished = existing.publication !== "published" && publication === "published";
  const { error } = await supabaseAdmin
    .from("showcase_projects")
    .update({
      publication,
      published_at: becamePublished ? new Date().toISOString() : existing.published_at,
    })
    .eq("id", id);
  if (error) throw new Error("Le changement de statut a échoué.");

  revalidateShowcase();
}

export async function deleteShowcaseProject(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("showcase_projects").delete().eq("id", id);
  if (error) throw new Error("La suppression a échoué.");
  revalidateShowcase();
}

/** Takes the whole ordered list and writes position = index.
 *
 *  The cleaner of the two reorder shapes in this codebase (lead statuses
 *  rather than posts): passing the full order means the result cannot drift
 *  from what the admin is looking at, where swapping a pair leaves every
 *  other row's value untouched and assumes they were right to begin with. */
export async function reorderShowcaseProjects(orderedIds: string[]): Promise<{ error: string | null }> {
  await requireAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabaseAdmin.from("showcase_projects").update({ sort_order: index }).eq("id", id)
    )
  );
  if (results.some((result) => result.error)) return { error: "Le réordonnancement a échoué." };
  revalidateShowcase();
  return { error: null };
}

/** A one-shot permission to write one object, minted by the service role.
 *
 *  This is the only browser-direct write path in the app, and it exists
 *  because a project film cannot travel any other way: every upload here
 *  goes through a Server Action, and next.config caps an action body at
 *  10 MB (less on some Vercel plans). The file therefore never touches the
 *  Next server at all.
 *
 *  It does not widen the bucket. The storage migration deliberately has no
 *  policies on storage.objects, on the grounds that every write is
 *  authorised by the service role — and a signed upload URL is exactly
 *  that, narrowed to one path and expiring. A delegation, not an opening.
 *
 *  The path is deterministic, unlike the journal's `Date.now()-random`
 *  which orphans its previous file on every replacement. For something
 *  measured in megabytes that matters. */
export async function createShowcaseUploadUrl(
  projectId: string,
  kind: "video" | "poster",
  extension: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  await requireAdmin();

  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : kind === "video" ? "mp4" : "webp";
  const path = `showcase/${projectId}/${kind}.${safeExtension}`;

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { path: null, token: null, error: "La préparation du téléversement a échoué." };

  return { path: data.path, token: data.token, error: null };
}

/** Brings the six entries that still live in src/data/projects.ts into the
 *  table.
 *
 *  The migration seeds them too, so this is for the case where the table was
 *  created but arrived empty — and, more usefully, it means the first thing
 *  someone sees in an empty admin is a way to fill it rather than a dead
 *  end. Refuses to run when anything is already there: it is an import, not
 *  a merge, and a second press should not double the portfolio.
 *
 *  Delete it once the file is gone. */
export async function importLegacyProjects(): Promise<{ error: string | null; imported: number }> {
  await requireAdmin();

  const { data: already, error: readError } = await supabaseAdmin.from("showcase_projects").select("id").limit(1);
  if (readError) {
    return {
      error: "La table showcase_projects est introuvable — la migration n'a pas encore été appliquée.",
      imported: 0,
    };
  }
  if (already && already.length > 0) {
    return { error: "Des réalisations existent déjà : l'import ne s'exécute qu'une fois.", imported: 0 };
  }

  const rows = PROJECTS.map((project, index) => ({
    slug: project.slug,
    reference: project.id,
    name: project.name,
    // Everything on the site today is live, so it arrives published — the
    // import reproduces the current state rather than hiding it behind a
    // review nobody asked for.
    publication: "published" as const,
    kind: project.status,
    published_at: new Date().toISOString(),
    sort_order: index,
    category: project.category,
    tags: [...project.tags],
    summary: project.summary,
    tagline: project.tagline,
    detail: project.detail,
    brief: project.brief,
    narrative_problem: project.narrative?.problem ?? null,
    narrative_system: project.narrative?.system ?? null,
    narrative_result: project.narrative?.result ?? null,
    deliverables: project.deliverables ? [...project.deliverables] : [],
    location: project.location,
    href: project.href,
    case_study_href: project.caseStudyHref,
    image_path: project.image,
    screen_path: project.screen,
    hover_logo_path: project.hoverLogo,
    gallery_paths: project.gallery ? [...project.gallery] : [],
    video_path: project.video?.src ?? null,
    video_poster_path: project.video?.poster ?? null,
    video_width: project.video?.width ?? null,
    video_height: project.video?.height ?? null,
    video_duration: project.video?.duration ?? null,
    metrics: project.metrics ?? [],
    testimonial_quote: project.testimonial?.quote ?? null,
    testimonial_author: project.testimonial?.author ?? null,
    show_on_home: project.showOnHome,
    featured: project.featured,
  }));

  const { error } = await supabaseAdmin.from("showcase_projects").insert(rows);
  if (error) return { error: "L'import a échoué.", imported: 0 };

  revalidateShowcase();
  return { error: null, imported: rows.length };
}
