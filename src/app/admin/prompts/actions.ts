"use server";

import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractVariableKeys, slugifyPrompt } from "@/lib/prompts/template";
import {
  promptInputSchema,
  type PromptInput,
  type PromptStatus,
  type PromptType,
  type TargetTool,
  type VariableType,
} from "./schema";

// Toutes les actions repassent par requireAdmin(), alors même que
// src/proxy.ts garde déjà /admin : défense en profondeur, la convention du
// reste de l'admin. Les échecs attendus reviennent en { error } plutôt que
// d'être levés — Next 16 remplace en production le message d'une exception
// de Server Action par une erreur React minifiée, donc un throw ne dit rien
// à personne.

// ── Formes renvoyées au client ───────────────────────────────────────────

export interface PromptListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: PromptType;
  targetTool: TargetTool;
  status: PromptStatus;
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  collectionIds: string[];
  variableCount: number;
  versionNumber: number;
  usageCount: number;
  lastUsedAt: string | null;
  updatedAt: string;
  parentPromptId: string | null;
  favorite: boolean;
}

export interface PromptVariableRow {
  id: string;
  key: string;
  label: string;
  type: VariableType;
  defaultValue: string;
  placeholder: string;
  description: string;
  options: string[];
  required: boolean;
  sortOrder: number;
}

export interface PromptDetail extends PromptListItem {
  content: string;
  variables: PromptVariableRow[];
  createdAt: string;
  /** Null tant que personne n'a noté : la fiche affiche « — », jamais un
   *  nombre par défaut. */
  averageRating: number | null;
  ratingCount: number;
  parentTitle: string | null;
  variantCount: number;
}

export interface PromptVersionRow {
  id: string;
  versionNumber: number;
  content: string;
  changeNote: string;
  createdAt: string;
  authorName: string | null;
}

export interface PromptUsageRow {
  id: string;
  promptId: string;
  promptTitle: string;
  versionNumber: number | null;
  createdAt: string;
  userName: string | null;
  projectName: string | null;
  targetTool: string | null;
  variables: Record<string, string>;
}

export interface PromptFilters {
  query?: string;
  categoryId?: string;
  type?: string;
  targetTool?: string;
  status?: string;
  collectionId?: string;
  tagSlug?: string;
  favoritesOnly?: boolean;
  sort?: "recent" | "used" | "title" | "usage";
}

const LIST_COLUMNS =
  "id,title,slug,description,type,target_tool,status,category_id,parent_prompt_id," +
  "version_number,usage_count,last_used_at,updated_at,created_at," +
  "prompt_categories(name),prompt_variables(id),prompt_tag_links(prompt_tags(name))," +
  "prompt_collection_items(collection_id)";

interface DbListRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  target_tool: string;
  status: string;
  category_id: string | null;
  parent_prompt_id: string | null;
  version_number: number;
  usage_count: number;
  last_used_at: string | null;
  updated_at: string;
  created_at: string;
  prompt_categories: { name: string } | null;
  prompt_variables: { id: string }[] | null;
  prompt_tag_links: { prompt_tags: { name: string } | null }[] | null;
  prompt_collection_items: { collection_id: string }[] | null;
}

function toListItem(row: DbListRow, favorites: Set<string>): PromptListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    type: row.type as PromptType,
    targetTool: row.target_tool as TargetTool,
    status: row.status as PromptStatus,
    categoryId: row.category_id,
    categoryName: row.prompt_categories?.name ?? null,
    tags: (row.prompt_tag_links ?? []).map((link) => link.prompt_tags?.name).filter((n): n is string => Boolean(n)),
    collectionIds: (row.prompt_collection_items ?? []).map((item) => item.collection_id),
    variableCount: (row.prompt_variables ?? []).length,
    versionNumber: row.version_number,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at,
    updatedAt: row.updated_at,
    parentPromptId: row.parent_prompt_id,
    favorite: favorites.has(row.id),
  };
}

const orNull = (value: string | undefined | null) => (value && value.trim() ? value.trim() : null);

/** PostgREST lit `or=(a.ilike.*x*,b.ilike.*x*)` comme une grammaire : une
 *  virgule ou une parenthèse dans la recherche coupe l'expression en deux
 *  et la requête part en 400. On neutralise donc les caractères qui ont un
 *  sens pour l'analyseur plutôt que d'espérer qu'ils n'arrivent jamais. */
function sanitizeSearch(query: string): string {
  return query.replace(/[,()*%\\"']/g, " ").trim();
}

async function favoriteIds(userId: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from("prompt_user_favorites").select("prompt_id").eq("user_id", userId);
  return new Set((data ?? []).map((row) => row.prompt_id as string));
}

// ── Lecture ──────────────────────────────────────────────────────────────

export async function getPrompts(filters: PromptFilters = {}): Promise<PromptListItem[]> {
  const user = await requireAdmin();

  // Collection et tag se résolvent en une liste d'identifiants avant la
  // requête principale. PostgREST sait filtrer sur une ressource imbriquée
  // avec !inner, mais la requête devient illisible et le moindre filtre
  // supplémentaire la casse ; deux allers-retours se lisent et se déboguent.
  let restrictToIds: string[] | null = null;

  if (filters.collectionId) {
    const { data } = await supabaseAdmin
      .from("prompt_collection_items")
      .select("prompt_id")
      .eq("collection_id", filters.collectionId);
    restrictToIds = (data ?? []).map((row) => row.prompt_id as string);
  }

  if (filters.tagSlug) {
    const { data: tag } = await supabaseAdmin
      .from("prompt_tags")
      .select("id")
      .eq("slug", filters.tagSlug)
      .maybeSingle();
    const { data } = tag
      ? await supabaseAdmin.from("prompt_tag_links").select("prompt_id").eq("tag_id", tag.id)
      : { data: [] as { prompt_id: string }[] };
    const tagged = (data ?? []).map((row) => row.prompt_id as string);
    restrictToIds = restrictToIds ? restrictToIds.filter((id) => tagged.includes(id)) : tagged;
  }

  const favorites = await favoriteIds(user.id);

  if (filters.favoritesOnly) {
    const favList = Array.from(favorites);
    restrictToIds = restrictToIds ? restrictToIds.filter((id) => favorites.has(id)) : favList;
  }

  // Un filtre qui ne retient rien doit rendre une liste vide, pas ignorer
  // le filtre — ce que ferait un .in() sur un tableau vide.
  if (restrictToIds && restrictToIds.length === 0) return [];

  let query = supabaseAdmin.from("prompts").select(LIST_COLUMNS);

  if (restrictToIds) query = query.in("id", restrictToIds);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.targetTool) query = query.eq("target_tool", filters.targetTool);

  // Les archivés sont masqués par défaut (§22) : ils restent accessibles en
  // choisissant explicitement ce statut dans les filtres.
  if (filters.status) query = query.eq("status", filters.status);
  else query = query.neq("status", "archived");

  const search = filters.query ? sanitizeSearch(filters.query) : "";
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%,slug.ilike.%${search}%`
    );
  }

  // Le tri est appliqué en dernier et jamais réaffecté : .order() rend un
  // builder de transformation, sur lequel .eq() n'existe plus. Empiler les
  // filtres d'abord, ordonner ensuite, est aussi l'ordre que PostgREST
  // attend dans l'URL.
  const ordered =
    filters.sort === "title"
      ? query.order("title", { ascending: true })
      : filters.sort === "used"
        ? query.order("last_used_at", { ascending: false, nullsFirst: false })
        : filters.sort === "usage"
          ? query.order("usage_count", { ascending: false })
          : query.order("updated_at", { ascending: false });

  const { data } = await ordered.limit(400);
  return ((data ?? []) as unknown as DbListRow[]).map((row) => toListItem(row, favorites));
}

export async function getPromptDetail(id: string): Promise<PromptDetail | null> {
  const user = await requireAdmin();

  const { data } = await supabaseAdmin
    .from("prompts")
    .select(`${LIST_COLUMNS},content`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const row = data as unknown as DbListRow & { content: string };
  const favorites = await favoriteIds(user.id);

  const [{ data: variables }, { data: ratings }, { data: parent }, { count: variantCount }] = await Promise.all([
    supabaseAdmin.from("prompt_variables").select("*").eq("prompt_id", id).order("sort_order"),
    supabaseAdmin.from("prompt_feedback").select("rating").eq("prompt_id", id).not("rating", "is", null),
    row.parent_prompt_id
      ? supabaseAdmin.from("prompts").select("title").eq("id", row.parent_prompt_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from("prompts").select("id", { count: "exact", head: true }).eq("parent_prompt_id", id),
  ]);

  const scores = (ratings ?? []).map((r) => r.rating as number);

  return {
    ...toListItem(row, favorites),
    content: row.content ?? "",
    createdAt: row.created_at,
    variables: (variables ?? []).map((variable) => ({
      id: variable.id as string,
      key: variable.key as string,
      label: (variable.label as string | null) ?? "",
      type: variable.type as VariableType,
      defaultValue: (variable.default_value as string | null) ?? "",
      placeholder: (variable.placeholder as string | null) ?? "",
      description: (variable.description as string | null) ?? "",
      options: Array.isArray(variable.options_json) ? (variable.options_json as string[]) : [],
      required: Boolean(variable.required),
      sortOrder: (variable.sort_order as number) ?? 0,
    })),
    // Moyenne réelle ou rien. Aucune valeur de repli : une note inventée
    // sur un outil de production est une information fausse qui décide.
    averageRating: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    ratingCount: scores.length,
    parentTitle: (parent as { title: string } | null)?.title ?? null,
    variantCount: variantCount ?? 0,
  };
}

export async function getPromptVersions(promptId: string): Promise<PromptVersionRow[]> {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("prompt_versions")
    .select("id,version_number,content,change_note,created_at,profiles(full_name)")
    .eq("prompt_id", promptId)
    .order("version_number", { ascending: false });

  return ((data ?? []) as unknown as {
    id: string;
    version_number: number;
    content: string;
    change_note: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }[]).map((row) => ({
    id: row.id,
    versionNumber: row.version_number,
    content: row.content,
    changeNote: row.change_note ?? "",
    createdAt: row.created_at,
    authorName: row.profiles?.full_name ?? null,
  }));
}

export async function getPromptUsage(promptId?: string): Promise<PromptUsageRow[]> {
  await requireAdmin();
  const base = supabaseAdmin
    .from("prompt_usage")
    .select(
      "id,prompt_id,created_at,target_tool,variables_json," +
        "prompts(title),prompt_versions(version_number),profiles(full_name),projects(name)"
    );

  const filtered = promptId ? base.eq("prompt_id", promptId) : base;
  const { data } = await filtered.order("created_at", { ascending: false }).limit(100);

  return ((data ?? []) as unknown as {
    id: string;
    prompt_id: string;
    created_at: string;
    target_tool: string | null;
    variables_json: Record<string, string> | null;
    prompts: { title: string } | null;
    prompt_versions: { version_number: number } | null;
    profiles: { full_name: string | null } | null;
    projects: { name: string } | null;
  }[]).map((row) => ({
    id: row.id,
    promptId: row.prompt_id,
    promptTitle: row.prompts?.title ?? "Prompt supprimé",
    versionNumber: row.prompt_versions?.version_number ?? null,
    createdAt: row.created_at,
    userName: row.profiles?.full_name ?? null,
    projectName: row.projects?.name ?? null,
    targetTool: row.target_tool,
    variables: row.variables_json ?? {},
  }));
}

/** Les projets du portail client, pour rattacher une génération à un
 *  chantier. Optionnel de bout en bout : un prompt utilisé sans projet est
 *  le cas normal. */
export async function getPromptProjectOptions(): Promise<{ id: string; label: string }[]> {
  await requireAdmin();
  const { data } = await supabaseAdmin.from("projects").select("id,name").order("name").limit(200);
  return (data ?? []).map((row) => ({ id: row.id as string, label: row.name as string }));
}

// ── Écriture ─────────────────────────────────────────────────────────────

/** Réécrit les liens tag et collection d'un prompt à partir de la liste que
 *  le formulaire a envoyée. Les tags sont créés à la volée : en demander la
 *  création séparée ferait un aller-retour par tag pour une table dont le
 *  seul contenu est un nom. */
async function syncTagsAndCollections(promptId: string, tags: string[], collectionIds: string[]) {
  // Dédoublonnage par slug et non par nom : « SEO » et « seo » produisent le
  // même slug, et deux lignes de même clé de conflit dans un seul upsert
  // font échouer Postgres avec « cannot affect row a second time ».
  const bySlug = new Map<string, { name: string; slug: string }>();
  for (const tag of tags) {
    const name = tag.trim();
    const slug = slugifyPrompt(name);
    if (name && slug && !bySlug.has(slug)) bySlug.set(slug, { name, slug });
  }

  const tagIds: string[] = [];
  if (bySlug.size) {
    const { data: upserted } = await supabaseAdmin
      .from("prompt_tags")
      .upsert(Array.from(bySlug.values()), { onConflict: "slug" })
      .select("id");
    for (const row of upserted ?? []) tagIds.push(row.id as string);
  }

  await supabaseAdmin.from("prompt_tag_links").delete().eq("prompt_id", promptId);
  if (tagIds.length) {
    await supabaseAdmin.from("prompt_tag_links").insert(tagIds.map((tagId) => ({ prompt_id: promptId, tag_id: tagId })));
  }

  await supabaseAdmin.from("prompt_collection_items").delete().eq("prompt_id", promptId);
  if (collectionIds.length) {
    await supabaseAdmin
      .from("prompt_collection_items")
      .insert(collectionIds.map((collectionId) => ({ collection_id: collectionId, prompt_id: promptId })));
  }
}

/** Écrit les variables déclarées, puis supprime celles qui ont disparu.
 *
 *  Upsert d'abord et élagage ensuite, plutôt que supprimer-puis-réinsérer :
 *  si le second appel échoue, il reste des variables en trop — visible et
 *  réparable. Dans l'autre ordre, un échec fait disparaître les
 *  déclarations, et personne ne s'en aperçoit avant d'ouvrir le formulaire
 *  d'utilisation. */
async function syncVariables(promptId: string, variables: PromptInput["variables"]) {
  const rows = variables.map((variable, index) => ({
    prompt_id: promptId,
    key: variable.key.trim(),
    label: orNull(variable.label),
    type: variable.type,
    default_value: orNull(variable.defaultValue),
    placeholder: orNull(variable.placeholder),
    description: orNull(variable.description),
    options_json: variable.options,
    required: variable.required,
    sort_order: index,
  }));

  if (rows.length) {
    await supabaseAdmin.from("prompt_variables").upsert(rows, { onConflict: "prompt_id,key" });
    const keys = rows.map((row) => row.key);
    await supabaseAdmin
      .from("prompt_variables")
      .delete()
      .eq("prompt_id", promptId)
      .not("key", "in", `(${keys.map((key) => `"${key}"`).join(",")})`);
  } else {
    await supabaseAdmin.from("prompt_variables").delete().eq("prompt_id", promptId);
  }
}

/** Deux variables de même clé n'ont pas de sens — {{cle}} est remplacée
 *  partout d'un coup — et la contrainte unique les refuserait de toute
 *  façon, avec un message Postgres que personne ne peut lire. Autant le
 *  dire ici. */
function duplicateVariableKey(variables: PromptInput["variables"]): string | null {
  const seen = new Set<string>();
  for (const variable of variables) {
    const key = variable.key.trim();
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}

/** base, base-2, base-3… Utilisé là où le slug est dérivé sans que personne
 *  ne l'ait choisi (duplication, import) ; quand l'admin l'a saisi
 *  lui-même, une collision doit lui être dite, pas contournée. */
async function uniqueSlug(base: string): Promise<string> {
  const root = base || "prompt";
  const { data } = await supabaseAdmin.from("prompts").select("slug").like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((row) => row.slug as string));
  if (!taken.has(root)) return root;
  let suffix = 2;
  while (taken.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
}

export async function createPrompt(input: PromptInput): Promise<{ error: string | null; id?: string }> {
  const user = await requireAdmin();
  const parsed = promptInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const slug = slugifyPrompt(parsed.data.slug || parsed.data.title);
  if (!slug) return { error: "Slug invalide." };

  const duplicate = duplicateVariableKey(parsed.data.variables);
  if (duplicate) return { error: `Deux variables portent la clé « ${duplicate} ».` };

  const { data, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      title: parsed.data.title.trim(),
      slug,
      description: orNull(parsed.data.description),
      content: parsed.data.content,
      category_id: orNull(parsed.data.categoryId),
      type: parsed.data.type,
      target_tool: parsed.data.targetTool,
      status: parsed.data.status,
      parent_prompt_id: orNull(parsed.data.parentPromptId),
      version_number: 1,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre prompt." };
    return { error: "La création du prompt a échoué." };
  }

  const id = data.id as string;

  // La v1 est écrite tout de suite. Un prompt dont l'historique commence à
  // la première modification ne peut pas être restauré dans son état
  // d'origine, ce qui est la première chose qu'on demande à un historique.
  await supabaseAdmin.from("prompt_versions").insert({
    prompt_id: id,
    version_number: 1,
    content: parsed.data.content,
    change_note: orNull(parsed.data.changeNote) ?? "Création",
    created_by: user.id,
  });

  await syncVariables(id, parsed.data.variables);
  await syncTagsAndCollections(id, parsed.data.tags, parsed.data.collectionIds);

  return { error: null, id };
}

export async function updatePrompt(id: string, input: PromptInput): Promise<{ error: string | null }> {
  const user = await requireAdmin();
  const parsed = promptInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { data: existing } = await supabaseAdmin
    .from("prompts")
    .select("content,version_number")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "Prompt introuvable." };

  const slug = slugifyPrompt(parsed.data.slug || parsed.data.title);
  if (!slug) return { error: "Slug invalide." };

  const duplicate = duplicateVariableKey(parsed.data.variables);
  if (duplicate) return { error: `Deux variables portent la clé « ${duplicate} ».` };

  // Une version par changement de contenu, et seulement là. Renommer un
  // prompt ou corriger sa description ne crée pas de v8 : l'historique
  // porte sur ce qui est envoyé au modèle.
  const contentChanged = (existing.content as string) !== parsed.data.content;
  const nextVersion = contentChanged ? (existing.version_number as number) + 1 : (existing.version_number as number);

  const { error } = await supabaseAdmin
    .from("prompts")
    .update({
      title: parsed.data.title.trim(),
      slug,
      description: orNull(parsed.data.description),
      content: parsed.data.content,
      category_id: orNull(parsed.data.categoryId),
      type: parsed.data.type,
      target_tool: parsed.data.targetTool,
      status: parsed.data.status,
      parent_prompt_id: orNull(parsed.data.parentPromptId) === id ? null : orNull(parsed.data.parentPromptId),
      version_number: nextVersion,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ce slug est déjà utilisé par un autre prompt." };
    return { error: "L'enregistrement a échoué." };
  }

  if (contentChanged) {
    await supabaseAdmin.from("prompt_versions").insert({
      prompt_id: id,
      version_number: nextVersion,
      content: parsed.data.content,
      change_note: orNull(parsed.data.changeNote),
      created_by: user.id,
    });
  }

  await syncVariables(id, parsed.data.variables);
  await syncTagsAndCollections(id, parsed.data.tags, parsed.data.collectionIds);

  return { error: null };
}

export async function setPromptStatus(id: string, status: PromptStatus) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("prompts").update({ status }).eq("id", id);
  if (error) throw new Error("Le changement de statut a échoué.");
}

export async function deletePrompt(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("prompts").delete().eq("id", id);
  if (error) throw new Error("La suppression a échoué.");
}

/** Duplique le contenu, les variables, les tags, la catégorie, l'outil.
 *  Pas l'historique, pas le journal d'usage, pas les retours : ils
 *  appartiennent au prompt qui les a vécus (§31). */
export async function duplicatePrompt(id: string): Promise<{ error: string | null; id?: string }> {
  const user = await requireAdmin();

  const { data: source } = await supabaseAdmin.from("prompts").select("*").eq("id", id).maybeSingle();
  if (!source) return { error: "Prompt introuvable." };

  const title = `Copie de ${source.title as string}`;
  const slug = await uniqueSlug(slugifyPrompt(title));

  const { data: created, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      title,
      slug,
      description: source.description,
      content: source.content,
      category_id: source.category_id,
      type: source.type,
      target_tool: source.target_tool,
      // Une copie naît en brouillon : elle est là pour être modifiée, pas
      // pour doubler l'original dans la bibliothèque.
      status: "draft",
      parent_prompt_id: source.parent_prompt_id,
      version_number: 1,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !created) return { error: "La duplication a échoué." };
  const newId = created.id as string;

  await supabaseAdmin.from("prompt_versions").insert({
    prompt_id: newId,
    version_number: 1,
    content: source.content,
    change_note: `Dupliqué depuis « ${source.title as string} »`,
    created_by: user.id,
  });

  const { data: variables } = await supabaseAdmin.from("prompt_variables").select("*").eq("prompt_id", id);
  if (variables?.length) {
    await supabaseAdmin.from("prompt_variables").insert(
      variables.map((variable) => ({
        prompt_id: newId,
        key: variable.key,
        label: variable.label,
        type: variable.type,
        default_value: variable.default_value,
        placeholder: variable.placeholder,
        description: variable.description,
        options_json: variable.options_json,
        required: variable.required,
        sort_order: variable.sort_order,
      }))
    );
  }

  const { data: tagLinks } = await supabaseAdmin.from("prompt_tag_links").select("tag_id").eq("prompt_id", id);
  if (tagLinks?.length) {
    await supabaseAdmin
      .from("prompt_tag_links")
      .insert(tagLinks.map((link) => ({ prompt_id: newId, tag_id: link.tag_id })));
  }

  return { error: null, id: newId };
}

export async function togglePromptFavorite(id: string): Promise<{ favorite: boolean }> {
  const user = await requireAdmin();
  const { data: existing } = await supabaseAdmin
    .from("prompt_user_favorites")
    .select("prompt_id")
    .eq("user_id", user.id)
    .eq("prompt_id", id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("prompt_user_favorites").delete().eq("user_id", user.id).eq("prompt_id", id);
    return { favorite: false };
  }

  await supabaseAdmin.from("prompt_user_favorites").insert({ user_id: user.id, prompt_id: id });
  return { favorite: true };
}

/** Restaurer n'écrase rien.
 *
 *  Le contenu de la version choisie devient le contenu courant ET une
 *  version neuve. Réécrire l'historique à l'endroit de la restauration
 *  rendrait fausse la seule question à laquelle il sert à répondre :
 *  « quelle version ai-je utilisée le 12 ? ». */
export async function restorePromptVersion(promptId: string, versionId: string): Promise<{ error: string | null }> {
  const user = await requireAdmin();

  const { data: version } = await supabaseAdmin
    .from("prompt_versions")
    .select("content,version_number")
    .eq("id", versionId)
    .eq("prompt_id", promptId)
    .maybeSingle();
  if (!version) return { error: "Version introuvable." };

  const { data: prompt } = await supabaseAdmin
    .from("prompts")
    .select("version_number")
    .eq("id", promptId)
    .maybeSingle();
  if (!prompt) return { error: "Prompt introuvable." };

  const nextVersion = (prompt.version_number as number) + 1;

  const { error } = await supabaseAdmin
    .from("prompts")
    .update({ content: version.content, version_number: nextVersion })
    .eq("id", promptId);
  if (error) return { error: "La restauration a échoué." };

  await supabaseAdmin.from("prompt_versions").insert({
    prompt_id: promptId,
    version_number: nextVersion,
    content: version.content,
    change_note: `Restauration de la v${version.version_number}`,
    created_by: user.id,
  });

  return { error: null };
}

/** Enregistre une génération.
 *
 *  On garde les valeurs saisies — sans elles, la ligne ne dit pas ce qui a
 *  réellement été produit — mais pas la sortie, qui se reconstruit à partir
 *  de la version et des valeurs. Chaque valeur est tronquée : un document
 *  collé dans un champ textarea n'a pas à peser dans un journal.
 *
 *  Le compteur est mis à jour sans passer par updated_at : le trigger a une
 *  clause WHEN qui l'exclut, sinon utiliser un prompt le ferait remonter en
 *  tête de « récemment modifiés ». */
export async function logPromptUsage(input: {
  promptId: string;
  values: Record<string, string>;
  projectId?: string;
}): Promise<{ error: string | null }> {
  const user = await requireAdmin();

  const { data: prompt } = await supabaseAdmin
    .from("prompts")
    .select("version_number,target_tool,usage_count")
    .eq("id", input.promptId)
    .maybeSingle();
  if (!prompt) return { error: "Prompt introuvable." };

  const { data: version } = await supabaseAdmin
    .from("prompt_versions")
    .select("id")
    .eq("prompt_id", input.promptId)
    .eq("version_number", prompt.version_number)
    .maybeSingle();

  const trimmed: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.values)) {
    if (typeof value === "string" && value.trim()) trimmed[key] = value.slice(0, 2000);
  }

  await supabaseAdmin.from("prompt_usage").insert({
    prompt_id: input.promptId,
    version_id: version?.id ?? null,
    user_id: user.id,
    project_id: orNull(input.projectId),
    variables_json: trimmed,
    target_tool: prompt.target_tool,
  });

  await supabaseAdmin
    .from("prompts")
    .update({
      usage_count: ((prompt.usage_count as number) ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", input.promptId);

  return { error: null };
}

export async function submitPromptFeedback(input: {
  promptId: string;
  verdict?: "up" | "down";
  rating?: number;
  feedback?: string;
}): Promise<{ error: string | null }> {
  const user = await requireAdmin();

  const rating = input.rating && input.rating >= 1 && input.rating <= 5 ? Math.round(input.rating) : null;
  const feedback = orNull(input.feedback);
  const verdict = input.verdict === "up" || input.verdict === "down" ? input.verdict : null;

  if (!verdict && !rating && !feedback) return { error: "Rien à enregistrer." };

  const { error } = await supabaseAdmin.from("prompt_feedback").insert({
    prompt_id: input.promptId,
    user_id: user.id,
    verdict,
    rating,
    feedback,
  });

  if (error) return { error: "L'enregistrement du retour a échoué." };
  return { error: null };
}

/** Crée un prompt à partir d'une génération : le contenu produit devient
 *  une variante rattachée à son master (§14, §16). Les variables ne sont
 *  pas reprises — elles sont déjà résolues dans le texte. */
export async function savePromptVariant(
  parentId: string,
  title: string,
  content: string
): Promise<{ error: string | null; id?: string }> {
  const user = await requireAdmin();
  if (!title.trim()) return { error: "Donnez un nom à la variante." };
  if (!content.trim()) return { error: "Le contenu est vide." };

  const { data: parent } = await supabaseAdmin
    .from("prompts")
    .select("category_id,type,target_tool")
    .eq("id", parentId)
    .maybeSingle();
  if (!parent) return { error: "Prompt parent introuvable." };

  const slug = await uniqueSlug(slugifyPrompt(title));

  const { data, error } = await supabaseAdmin
    .from("prompts")
    .insert({
      title: title.trim(),
      slug,
      content,
      category_id: parent.category_id,
      type: parent.type,
      target_tool: parent.target_tool,
      status: "draft",
      parent_prompt_id: parentId,
      version_number: 1,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "La création de la variante a échoué." };

  await supabaseAdmin.from("prompt_versions").insert({
    prompt_id: data.id as string,
    version_number: 1,
    content,
    change_note: "Variante générée",
    created_by: user.id,
  });

  return { error: null, id: data.id as string };
}

/** Le contenu d'un prompt, en JSON ou en Markdown, pour sortir de l'outil
 *  sans passer par la base (§40). Rendu comme une chaîne : le
 *  téléchargement se fait côté navigateur, ce qui évite une route. */
export async function exportPrompt(id: string, format: "json" | "markdown"): Promise<{ filename: string; body: string } | null> {
  await requireAdmin();

  const detail = await getPromptDetail(id);
  if (!detail) return null;

  if (format === "json") {
    return {
      filename: `${detail.slug}.json`,
      body: JSON.stringify(
        {
          title: detail.title,
          slug: detail.slug,
          description: detail.description,
          type: detail.type,
          targetTool: detail.targetTool,
          category: detail.categoryName,
          tags: detail.tags,
          content: detail.content,
          variables: detail.variables.map((variable) => ({
            key: variable.key,
            label: variable.label,
            type: variable.type,
            defaultValue: variable.defaultValue,
            placeholder: variable.placeholder,
            description: variable.description,
            options: variable.options,
            required: variable.required,
          })),
        },
        null,
        2
      ),
    };
  }

  const header = [
    `# ${detail.title}`,
    "",
    detail.description,
    "",
    `- Type : ${detail.type}`,
    `- Outil : ${detail.targetTool}`,
    detail.categoryName ? `- Catégorie : ${detail.categoryName}` : "",
    detail.tags.length ? `- Tags : ${detail.tags.join(", ")}` : "",
    "",
    "---",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { filename: `${detail.slug}.md`, body: `${header}\n\n${detail.content}\n` };
}

/** L'import (§40). Accepte le JSON produit par exportPrompt et un Markdown
 *  brut, dont le premier titre de niveau 1 devient le nom. Les variables
 *  d'un Markdown sont déduites de son contenu : on ne devine pas leur type,
 *  elles arrivent en texte court et se règlent ensuite. */
export async function importPrompt(payload: string, format: "json" | "markdown"): Promise<{ error: string | null; id?: string }> {
  await requireAdmin();
  if (!payload.trim()) return { error: "Rien à importer." };

  let input: PromptInput;

  if (format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return { error: "JSON illisible." };
    }
    const source = parsed as Record<string, unknown>;
    if (typeof source.content !== "string" || typeof source.title !== "string") {
      return { error: "Il manque au moins un titre et un contenu." };
    }
    input = {
      title: source.title,
      slug: "",
      description: typeof source.description === "string" ? source.description : "",
      content: source.content,
      categoryId: "",
      type: "build",
      targetTool: "generic",
      status: "draft",
      parentPromptId: "",
      tags: Array.isArray(source.tags) ? (source.tags as string[]).filter((t) => typeof t === "string") : [],
      collectionIds: [],
      variables: Array.isArray(source.variables)
        ? (source.variables as Record<string, unknown>[])
            .filter((variable) => typeof variable.key === "string")
            .map((variable) => ({
              key: variable.key as string,
              label: typeof variable.label === "string" ? variable.label : "",
              type: "text" as VariableType,
              defaultValue: typeof variable.defaultValue === "string" ? variable.defaultValue : "",
              placeholder: "",
              description: "",
              options: [],
              required: Boolean(variable.required),
            }))
        : [],
      changeNote: "Importé",
    };
  } else {
    const heading = /^#\s+(.+)$/m.exec(payload);
    input = {
      title: heading ? heading[1].trim() : "Prompt importé",
      slug: "",
      description: "",
      content: payload,
      categoryId: "",
      type: "build",
      targetTool: "generic",
      status: "draft",
      parentPromptId: "",
      tags: [],
      collectionIds: [],
      variables: extractVariableKeys(payload).map((key) => ({
        key,
        label: "",
        type: "text" as VariableType,
        defaultValue: "",
        placeholder: "",
        description: "",
        options: [],
        required: false,
      })),
      changeNote: "Importé",
    };
  }

  // Le titre importé peut entrer en collision ; c'est une opération
  // automatique, donc le slug est dérivé plutôt que refusé.
  const slug = await uniqueSlug(slugifyPrompt(input.title));
  return createPrompt({ ...input, slug });
}
