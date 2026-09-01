"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl, resolvePostImageUrl, uploadPortalAsset } from "@/lib/portal/storage";
import { postInputSchema, relatedPostIdsSchema, type PostInput } from "./schema";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents (NFD splits e.g. "é" into "e" + a combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  image: string | null;
  tag: string | null;
  dateLabel: string | null;
  readingTime: string | null;
  featured: boolean;
  status: "draft" | "published";
  metaTitle: string | null;
  metaDescription: string | null;
  authorName: string | null;
  audioUrl: string | null;
  relatedPostIds: string[];
  sortOrder: number | null;
  views: number;
  likes: number;
  projectId: string | null;
  clientDisplayName: string | null;
  createdAt: string;
  updatedAt: string;
};

function toPostRow(row: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_path: string | null;
  tag: string | null;
  date_label: string | null;
  reading_time: string | null;
  featured: boolean;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string | null;
  audio_url: string | null;
  related_post_ids: string[] | null;
  sort_order: number | null;
  views: number;
  likes: number;
  project_id: string | null;
  client_display_name: string | null;
  created_at: string;
  updated_at: string;
}): PostRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    image: resolvePostImageUrl(row.cover_image_path),
    tag: row.tag,
    dateLabel: row.date_label,
    readingTime: row.reading_time,
    featured: row.featured,
    status: row.status as "draft" | "published",
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    authorName: row.author_name,
    audioUrl: row.audio_url,
    relatedPostIds: row.related_post_ids ?? [],
    sortOrder: row.sort_order,
    views: row.views,
    likes: row.likes,
    projectId: row.project_id,
    clientDisplayName: row.client_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const POST_COLUMNS =
  "id, title, slug, excerpt, body, cover_image_path, tag, date_label, reading_time, featured, status, meta_title, meta_description, author_name, audio_url, related_post_ids, sort_order, views, likes, project_id, client_display_name, created_at, updated_at";

// Read functions used as TanStack Query queryFns from the client — still
// gated by requireAdmin() and still going through supabaseAdmin server-side,
// same security model as every other admin table in this codebase (RLS on
// `posts` only grants public read of published rows — there is no
// authenticated-write policy, so these reads/writes only ever happen
// through this Server Action, never a direct client-side Supabase call).
export async function getArticles(): Promise<PostRow[]> {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("posts")
    .select(POST_COLUMNS)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map(toPostRow);
}

export async function getArticleById(id: string): Promise<PostRow | null> {
  await requireAdmin();
  const { data } = await supabaseAdmin.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
  return data ? toPostRow(data) : null;
}

function toDbFields(input: PostInput, relatedPostIds: string[]) {
  return {
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    body: input.body?.trim() || "",
    tag: input.tag.trim(),
    date_label: input.dateLabel.trim(),
    reading_time: input.readingTime.trim(),
    featured: input.featured,
    status: input.status,
    meta_title: input.metaTitle?.trim() || null,
    meta_description: input.metaDescription?.trim() || null,
    author_name: input.authorName?.trim() || null,
    audio_url: input.audioUrl?.trim() || null,
    related_post_ids: relatedPostIds,
    project_id: input.projectId || null,
    client_display_name: input.clientDisplayName?.trim() || null,
  };
}

export async function createPost(
  input: PostInput,
  relatedPostIdsRaw: string[]
): Promise<{ error: string | null; id?: string }> {
  const admin = await requireAdmin();

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const relatedResult = relatedPostIdsSchema.safeParse(relatedPostIdsRaw);
  if (!relatedResult.success) return { error: relatedResult.error.issues[0]?.message ?? "Articles liés invalides." };

  const postId = crypto.randomUUID();
  const slug = parsed.data.slug?.trim() ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) return { error: "Slug invalide." };

  // image is already a hosted public URL by the time it reaches here —
  // ImagePicker uploads (with crop) immediately on confirm and hands back
  // a public URL, it never travels through this action as a raw File.
  const { error } = await supabaseAdmin.from("posts").insert({
    id: postId,
    slug,
    ...toDbFields(parsed.data, relatedResult.data),
    cover_image_path: parsed.data.image,
    status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    author_id: admin.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre article." };
    return { error: "La création de l'article a échoué." };
  }

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  return { error: null, id: postId };
}

export async function updatePost(
  postId: string,
  input: PostInput,
  relatedPostIdsRaw: string[]
): Promise<{ error: string | null }> {
  await requireAdmin();

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const relatedResult = relatedPostIdsSchema.safeParse(relatedPostIdsRaw);
  if (!relatedResult.success) return { error: relatedResult.error.issues[0]?.message ?? "Articles liés invalides." };

  const { data: existing } = await supabaseAdmin.from("posts").select("status, published_at, slug").eq("id", postId).maybeSingle();
  if (!existing) return { error: "Article introuvable." };

  const slug = parsed.data.slug?.trim() ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  if (!slug) return { error: "Slug invalide." };

  const becamePublished = existing.status !== "published" && parsed.data.status === "published";

  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      slug,
      ...toDbFields(parsed.data, relatedResult.data),
      cover_image_path: parsed.data.image,
      published_at: becamePublished ? new Date().toISOString() : existing.published_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre article." };
    return { error: "La mise à jour de l'article a échoué." };
  }

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  revalidatePath(`/journal/${existing.slug}`);
  if (slug !== existing.slug) revalidatePath(`/journal/${slug}`);
  return { error: null };
}

// Quick status toggle from the list row — doesn't require the full PostInput
// payload updatePost() needs, same narrow-update shape as updateQuoteStatus/
// updateLeadStatus elsewhere in admin.
export async function setPostStatus(postId: string, status: "draft" | "published") {
  await requireAdmin();

  const { data: existing } = await supabaseAdmin.from("posts").select("status, published_at, slug").eq("id", postId).maybeSingle();
  if (!existing) throw new Error("Article introuvable.");

  const becamePublished = existing.status !== "published" && status === "published";

  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      status,
      published_at: becamePublished ? new Date().toISOString() : existing.published_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) throw new Error("Le changement de statut a échoué.");

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  revalidatePath(`/journal/${existing.slug}`);
}

export async function deletePost(postId: string) {
  await requireAdmin();

  const { data: existing } = await supabaseAdmin.from("posts").select("slug").eq("id", postId).maybeSingle();
  if (!existing) throw new Error("Article introuvable.");

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", postId);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  revalidatePath(`/journal/${existing.slug}`);
}

export async function reorderPosts(updates: { id: string; sortOrder: number }[]) {
  await requireAdmin();

  await Promise.all(
    updates.map((u) => supabaseAdmin.from("posts").update({ sort_order: u.sortOrder }).eq("id", u.id))
  );

  revalidatePath("/admin/content");
}

// Generic "upload an image, get a public URL back" action — used by both
// the ImagePicker's crop-confirm step and RichEditor's inline image
// insertion. Reuses the existing portal-assets bucket/helpers (already
// public, already has upload/getPublicUrl plumbing) rather than the spec's
// separate "article-images" bucket, which doesn't exist in this project
// and this environment has no tooling to create.
export async function uploadEditorImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { url: null, error: "Fichier invalide." };
  if (!file.type.startsWith("image/")) return { url: null, error: "Le fichier doit être une image." };

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `posts/inline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    await uploadPortalAsset(path, file);
  } catch {
    return { url: null, error: "Le téléversement a échoué." };
  }

  const url = getPublicAssetUrl(path);
  if (!url) return { url: null, error: "Le téléversement a échoué." };
  return { url, error: null };
}
