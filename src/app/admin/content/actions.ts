"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadPortalAsset } from "@/lib/portal/storage";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // strip combining accents (NFD splits e.g. "é" into "e" + a combining mark)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readPostFields(formData: FormData) {
  const title = formData.get("title");
  const excerpt = formData.get("excerpt");
  const body = formData.get("body");
  const slugInput = formData.get("slug");
  const projectId = formData.get("project_id");
  const clientDisplayName = formData.get("client_display_name");
  const status = formData.get("status");

  if (typeof title !== "string" || !title.trim()) throw new Error("Titre requis.");
  if (typeof body !== "string" || !body.trim()) throw new Error("Contenu requis.");

  const slug = typeof slugInput === "string" && slugInput.trim() ? slugify(slugInput) : slugify(title);
  if (!slug) throw new Error("Slug invalide.");

  return {
    title: title.trim(),
    excerpt: typeof excerpt === "string" && excerpt.trim() ? excerpt.trim() : null,
    body: body.trim(),
    slug,
    projectId: typeof projectId === "string" && projectId ? projectId : null,
    clientDisplayName: typeof clientDisplayName === "string" && clientDisplayName.trim() ? clientDisplayName.trim() : null,
    status: status === "published" ? "published" : "draft",
  };
}

export async function createPost(formData: FormData) {
  const admin = await requireAdmin();
  const fields = readPostFields(formData);

  const postId = crypto.randomUUID();
  let coverImagePath: string | null = null;
  const coverFile = formData.get("cover_image");
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `posts/${postId}-${coverFile.name}`;
    await uploadPortalAsset(coverImagePath, coverFile);
  }

  const { error } = await supabaseAdmin.from("posts").insert({
    id: postId,
    slug: fields.slug,
    title: fields.title,
    excerpt: fields.excerpt,
    body: fields.body,
    cover_image_path: coverImagePath,
    client_display_name: fields.clientDisplayName,
    project_id: fields.projectId,
    status: fields.status,
    published_at: fields.status === "published" ? new Date().toISOString() : null,
    author_id: admin.id,
  });

  if (error) {
    if (error.code === "23505") throw new Error("Ce slug est déjà utilisé par un autre article.");
    throw new Error("La création de l'article a échoué.");
  }

  revalidatePath("/admin/content");
  revalidatePath("/journal");
}

export async function updatePost(postId: string, formData: FormData) {
  await requireAdmin();
  const fields = readPostFields(formData);

  const { data: existing } = await supabaseAdmin.from("posts").select("status, published_at, cover_image_path, slug").eq("id", postId).maybeSingle();
  if (!existing) throw new Error("Article introuvable.");

  let coverImagePath = existing.cover_image_path;
  const coverFile = formData.get("cover_image");
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `posts/${postId}-${coverFile.name}`;
    await uploadPortalAsset(coverImagePath, coverFile);
  }

  const becamePublished = existing.status !== "published" && fields.status === "published";

  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      slug: fields.slug,
      title: fields.title,
      excerpt: fields.excerpt,
      body: fields.body,
      cover_image_path: coverImagePath,
      client_display_name: fields.clientDisplayName,
      project_id: fields.projectId,
      status: fields.status,
      published_at: becamePublished ? new Date().toISOString() : existing.published_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    if (error.code === "23505") throw new Error("Ce slug est déjà utilisé par un autre article.");
    throw new Error("La mise à jour de l'article a échoué.");
  }

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  revalidatePath(`/journal/${existing.slug}`);
  if (fields.slug !== existing.slug) revalidatePath(`/journal/${fields.slug}`);
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
