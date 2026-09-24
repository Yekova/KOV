"use server";

import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { slugifyPrompt } from "@/lib/prompts/template";
import { promptBlockSchema, type PromptBlockInput } from "./schema";
import { STARTER_BLOCKS, STARTER_PROMPTS, type StarterPrompt } from "./starter";
import { MOCKUP_CATEGORY, MOCKUP_PROMPTS } from "./starterMockup";

// Le classement de la bibliothèque : catégories, collections, tags, blocs.
// Séparé de actions.ts, qui porte déjà le cycle de vie d'un prompt — deux
// sujets, deux fichiers, plutôt qu'un seul de mille lignes.

export interface PromptCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  count: number;
}

export interface PromptCollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface PromptTagRow {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface PromptBlockRow extends PromptBlockInput {
  id: string;
  slug: string;
  sortOrder: number;
}

const orNull = (value: string | undefined | null) => (value && value.trim() ? value.trim() : null);

/** Les effectifs sont comptés côté application à partir d'une seule
 *  lecture, plutôt qu'avec un count() imbriqué par ligne. À l'échelle d'une
 *  bibliothèque interne c'est une requête au lieu de dix-sept, et ça ne
 *  dépend pas de la version de PostgREST déployée. */
async function countBy(table: string, column: string): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin.from(table).select(column);
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
    const key = row[column];
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// ── Catégories ───────────────────────────────────────────────────────────

export async function getPromptCategories(): Promise<PromptCategoryRow[]> {
  await requireAdmin();
  const [{ data }, counts] = await Promise.all([
    supabaseAdmin.from("prompt_categories").select("*").order("sort_order").order("name"),
    countBy("prompts", "category_id"),
  ]);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? "",
    sortOrder: (row.sort_order as number) ?? 0,
    count: counts.get(row.id as string) ?? 0,
  }));
}

export async function createPromptCategory(name: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nom requis." };

  const { count } = await supabaseAdmin.from("prompt_categories").select("id", { count: "exact", head: true });
  const { error } = await supabaseAdmin
    .from("prompt_categories")
    .insert({ name: trimmed, slug: slugifyPrompt(trimmed), sort_order: ((count ?? 0) + 1) * 10 });

  if (error) {
    if (error.code === "23505") return { error: "Cette catégorie existe déjà." };
    return { error: "La création de la catégorie a échoué." };
  }
  return { error: null };
}

export async function renamePromptCategory(id: string, name: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nom requis." };

  const { error } = await supabaseAdmin.from("prompt_categories").update({ name: trimmed }).eq("id", id);
  if (error) return { error: "Le renommage a échoué." };
  return { error: null };
}

/** La clé étrangère est en `on delete set null` : supprimer une catégorie
 *  déclasse ses prompts, elle ne les emporte pas. Le message le dit, parce
 *  que « supprimer » à côté d'un effectif de douze se lit facilement comme
 *  « supprimer les douze ». */
export async function deletePromptCategory(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("prompt_categories").delete().eq("id", id);
  if (error) return { error: "La suppression a échoué." };
  return { error: null };
}

export async function reorderPromptCategories(orderedIds: string[]): Promise<{ error: string | null }> {
  await requireAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabaseAdmin.from("prompt_categories").update({ sort_order: index * 10 }).eq("id", id)
    )
  );
  if (results.some((result) => result.error)) return { error: "Le réordonnancement a échoué." };
  return { error: null };
}

// ── Collections ──────────────────────────────────────────────────────────

export async function getPromptCollections(): Promise<PromptCollectionRow[]> {
  await requireAdmin();
  const [{ data }, counts] = await Promise.all([
    supabaseAdmin.from("prompt_collections").select("*").order("name"),
    countBy("prompt_collection_items", "collection_id"),
  ]);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? "",
    count: counts.get(row.id as string) ?? 0,
  }));
}

export async function createPromptCollection(name: string, description?: string): Promise<{ error: string | null }> {
  const user = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Nom requis." };

  const { error } = await supabaseAdmin.from("prompt_collections").insert({
    name: trimmed,
    slug: slugifyPrompt(trimmed),
    description: orNull(description),
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Cette collection existe déjà." };
    return { error: "La création de la collection a échoué." };
  }
  return { error: null };
}

export async function deletePromptCollection(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("prompt_collections").delete().eq("id", id);
  if (error) return { error: "La suppression a échoué." };
  return { error: null };
}

/** Le raccourci « Ajouter à une collection » du menu de ligne. Le
 *  formulaire complet passe par updatePrompt ; celui-ci évite d'ouvrir un
 *  formulaire pour cocher une case. */
export async function togglePromptCollection(
  promptId: string,
  collectionId: string
): Promise<{ error: string | null; added: boolean }> {
  await requireAdmin();
  const { data: existing } = await supabaseAdmin
    .from("prompt_collection_items")
    .select("prompt_id")
    .eq("prompt_id", promptId)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("prompt_collection_items")
      .delete()
      .eq("prompt_id", promptId)
      .eq("collection_id", collectionId);
    return { error: error ? "La mise à jour a échoué." : null, added: false };
  }

  const { error } = await supabaseAdmin
    .from("prompt_collection_items")
    .insert({ prompt_id: promptId, collection_id: collectionId });
  return { error: error ? "La mise à jour a échoué." : null, added: true };
}

// ── Tags ─────────────────────────────────────────────────────────────────

export async function getPromptTags(): Promise<PromptTagRow[]> {
  await requireAdmin();
  const [{ data }, counts] = await Promise.all([
    supabaseAdmin.from("prompt_tags").select("*").order("name"),
    countBy("prompt_tag_links", "tag_id"),
  ]);

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      count: counts.get(row.id as string) ?? 0,
    }))
    // Un tag dont plus aucun prompt ne se réclame encombre le filtre sans
    // rien filtrer. Il reste en base, il ne s'affiche plus.
    .filter((tag) => tag.count > 0);
}

// ── Blocs ────────────────────────────────────────────────────────────────

export async function getPromptBlocks(): Promise<PromptBlockRow[]> {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("prompt_blocks")
    .select("*")
    .neq("status", "archived")
    .order("sort_order")
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? "",
    content: (row.content as string | null) ?? "",
    category: (row.category as string | null) ?? "",
    status: row.status as PromptBlockInput["status"],
    sortOrder: (row.sort_order as number) ?? 0,
  }));
}

export async function createPromptBlock(input: PromptBlockInput): Promise<{ error: string | null }> {
  const user = await requireAdmin();
  const parsed = promptBlockSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { count } = await supabaseAdmin.from("prompt_blocks").select("id", { count: "exact", head: true });
  const { error } = await supabaseAdmin.from("prompt_blocks").insert({
    name: parsed.data.name.trim(),
    slug: slugifyPrompt(parsed.data.name),
    description: orNull(parsed.data.description),
    content: parsed.data.content,
    category: orNull(parsed.data.category),
    status: parsed.data.status,
    sort_order: (count ?? 0) * 10,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Un bloc porte déjà ce nom." };
    return { error: "La création du bloc a échoué." };
  }
  return { error: null };
}

export async function updatePromptBlock(id: string, input: PromptBlockInput): Promise<{ error: string | null }> {
  await requireAdmin();
  const parsed = promptBlockSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { error } = await supabaseAdmin
    .from("prompt_blocks")
    .update({
      name: parsed.data.name.trim(),
      description: orNull(parsed.data.description),
      content: parsed.data.content,
      category: orNull(parsed.data.category),
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) return { error: "L'enregistrement du bloc a échoué." };
  return { error: null };
}

export async function deletePromptBlock(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("prompt_blocks").delete().eq("id", id);
  if (error) return { error: "La suppression a échoué." };
  return { error: null };
}

/** Pose un prompt de pack : la ligne, sa v1, ses variables, ses tags.
 *
 *  Partagé par les deux packs. Rend false sans crier si l'insertion échoue
 *  — un slug déjà pris, typiquement — pour qu'un pack partiellement présent
 *  s'installe quand même sur ce qui manque au lieu de tout abandonner. */
async function insertStarterPrompt(
  starter: StarterPrompt,
  categoryId: string | null,
  userId: string,
  changeNote: string
): Promise<boolean> {
  const { data: created, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      title: starter.title,
      slug: slugifyPrompt(starter.title),
      description: starter.description,
      content: starter.content,
      category_id: categoryId,
      type: starter.type,
      target_tool: starter.targetTool,
      status: "active",
      version_number: 1,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !created) return false;
  const id = created.id as string;

  await supabaseAdmin.from("prompt_versions").insert({
    prompt_id: id,
    version_number: 1,
    content: starter.content,
    change_note: changeNote,
    created_by: userId,
  });

  if (starter.variables.length) {
    await supabaseAdmin.from("prompt_variables").insert(
      starter.variables.map((variable, index) => ({
        prompt_id: id,
        key: variable.key,
        label: variable.label,
        type: variable.type,
        placeholder: variable.placeholder ?? null,
        options_json: variable.options ?? [],
        required: variable.required ?? false,
        sort_order: index,
      }))
    );
  }

  if (starter.tags.length) {
    // Par slug : deux noms différents peuvent donner le même, et Postgres
    // refuse deux lignes de même clé de conflit dans un seul upsert.
    const bySlug = new Map(starter.tags.map((name) => [slugifyPrompt(name), name]));
    const { data: tagRows } = await supabaseAdmin
      .from("prompt_tags")
      .upsert(
        Array.from(bySlug.entries()).map(([slug, name]) => ({ name, slug })),
        { onConflict: "slug" }
      )
      .select("id");
    if (tagRows?.length) {
      await supabaseAdmin
        .from("prompt_tag_links")
        .insert(tagRows.map((tag) => ({ prompt_id: id, tag_id: tag.id as string })));
    }
  }

  return true;
}

// ── Bibliothèque de départ ───────────────────────────────────────────────

/** Ce que propose une bibliothèque vide.
 *
 *  Le §39 interdit de laisser du faux contenu en production, et il a
 *  raison : une base pré-remplie de prompts fictifs qu'on n'utilisera
 *  jamais rend l'outil inutilisable dès le premier jour. Rien n'est donc
 *  inséré par la migration. Ce que ce bouton pose n'est pas de la
 *  démonstration : ce sont des gabarits écrits pour cette base de code,
 *  avec de vraies variables, prêts à être modifiés ou supprimés.
 *
 *  Refuse de s'exécuter deux fois : c'est une installation, pas une fusion,
 *  et une seconde pression ne doit pas doubler la bibliothèque. */
export async function installStarterLibrary(): Promise<{ error: string | null; prompts: number; blocks: number }> {
  const user = await requireAdmin();

  const { data: already, error: readError } = await supabaseAdmin.from("prompts").select("id").limit(1);
  if (readError) {
    return {
      error: "La table prompts est introuvable — la migration n'a pas encore été appliquée.",
      prompts: 0,
      blocks: 0,
    };
  }
  if (already && already.length > 0) {
    return { error: "La bibliothèque contient déjà des prompts : l'installation ne s'exécute qu'une fois.", prompts: 0, blocks: 0 };
  }

  const { data: categories } = await supabaseAdmin.from("prompt_categories").select("id,slug");
  const categoryBySlug = new Map((categories ?? []).map((row) => [row.slug as string, row.id as string]));

  let prompts = 0;
  for (const starter of STARTER_PROMPTS) {
    const inserted = await insertStarterPrompt(
      starter,
      categoryBySlug.get(starter.categorySlug) ?? null,
      user.id,
      "Bibliothèque de départ"
    );
    if (inserted) prompts += 1;
  }

  const { error: blockError } = await supabaseAdmin.from("prompt_blocks").insert(
    STARTER_BLOCKS.map((block, index) => ({
      name: block.name,
      slug: slugifyPrompt(block.name),
      description: block.description,
      content: block.content,
      category: block.category,
      status: "active",
      sort_order: index * 10,
      created_by: user.id,
    }))
  );

  return { error: null, prompts, blocks: blockError ? 0 : STARTER_BLOCKS.length };
}

// ── Pack « Maquette site web » ───────────────────────────────────────────

/** Installe les dix étapes de construction d'une maquette.
 *
 *  Contrairement à la bibliothèque de départ, ce pack se pose sur une
 *  bibliothèque déjà peuplée : il crée sa catégorie si elle manque et
 *  ignore les prompts dont le slug existe déjà. Relancer ne double donc
 *  rien, et complète ce qui a été supprimé par erreur.
 *
 *  La catégorie est créée ici et non dans la migration : la migration peut
 *  déjà être appliquée quand ce pack arrive, et une migration qu'on
 *  retouche après coup est une migration qui ne sera jamais rejouée. */
export async function installMockupPack(): Promise<{
  error: string | null;
  installed: number;
  skipped: number;
}> {
  const user = await requireAdmin();

  const { error: readError } = await supabaseAdmin.from("prompts").select("id").limit(1);
  if (readError) {
    return {
      error: "La table prompts est introuvable — la migration n'a pas encore été appliquée.",
      installed: 0,
      skipped: 0,
    };
  }

  // upsert plutôt que insert : la catégorie peut avoir été créée à la main,
  // ou par une première exécution de ce même pack.
  await supabaseAdmin
    .from("prompt_categories")
    .upsert(
      { name: MOCKUP_CATEGORY.name, slug: MOCKUP_CATEGORY.slug, sort_order: MOCKUP_CATEGORY.sortOrder },
      { onConflict: "slug" }
    );

  const { data: category } = await supabaseAdmin
    .from("prompt_categories")
    .select("id")
    .eq("slug", MOCKUP_CATEGORY.slug)
    .maybeSingle();

  const slugs = MOCKUP_PROMPTS.map((prompt) => slugifyPrompt(prompt.title));
  const { data: existing } = await supabaseAdmin.from("prompts").select("slug").in("slug", slugs);
  const taken = new Set((existing ?? []).map((row) => row.slug as string));

  let installed = 0;
  let skipped = 0;

  for (const prompt of MOCKUP_PROMPTS) {
    if (taken.has(slugifyPrompt(prompt.title))) {
      skipped += 1;
      continue;
    }
    const ok = await insertStarterPrompt(
      prompt,
      (category?.id as string | undefined) ?? null,
      user.id,
      "Pack maquette site web"
    );
    if (ok) installed += 1;
    else skipped += 1;
  }

  return { error: null, installed, skipped };
}
