import { z } from "zod";

// Partagé par react-hook-form (zodResolver, côté client) et par les Server
// Actions, qui revalident systématiquement : une validation client est du
// confort d'usage, jamais une garantie. Même convention que
// /admin/content/schema.ts et /admin/realisations/schema.ts.
//
// Ce fichier porte aussi les libellés et les listes de valeurs, parce qu'un
// fichier "use server" ne peut exporter que des fonctions asynchrones — une
// constante exportée depuis actions.ts ferait échouer la compilation.

export const PROMPT_TYPES = ["build", "audit", "transform"] as const;
export type PromptType = (typeof PROMPT_TYPES)[number];

export const TYPE_LABELS: Record<PromptType, string> = {
  build: "Build",
  audit: "Audit",
  transform: "Transform",
};

export const TARGET_TOOLS = [
  "claude_code",
  "chatgpt",
  "gemini",
  "flow",
  "image_generation",
  "generic",
] as const;
export type TargetTool = (typeof TARGET_TOOLS)[number];

export const TOOL_LABELS: Record<TargetTool, string> = {
  claude_code: "Claude Code",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  flow: "Flow / Veo",
  image_generation: "Image Generation",
  generic: "LLM générique",
};

export const PROMPT_STATUSES = ["draft", "active", "deprecated", "archived"] as const;
export type PromptStatus = (typeof PROMPT_STATUSES)[number];

export const STATUS_LABELS: Record<PromptStatus, string> = {
  draft: "Brouillon",
  active: "Actif",
  deprecated: "Déprécié",
  archived: "Archivé",
};

/** Ce que chaque statut veut dire en pratique, affiché là où on le choisit
 *  — sinon « déprécié » et « archivé » se ressemblent assez pour être
 *  utilisés au hasard. */
export const STATUS_HINTS: Record<PromptStatus, string> = {
  draft: "En cours d'écriture, visible de vous seul dans la bibliothèque.",
  active: "Utilisable normalement.",
  deprecated: "Encore utilisable, mais signalé comme dépassé.",
  archived: "Masqué par défaut dans la bibliothèque.",
};

export const VARIABLE_TYPES = [
  "text",
  "textarea",
  "select",
  "multiselect",
  "boolean",
  "number",
  "url",
  "code",
] as const;
export type VariableType = (typeof VARIABLE_TYPES)[number];

export const VARIABLE_TYPE_LABELS: Record<VariableType, string> = {
  text: "Texte court",
  textarea: "Texte long",
  select: "Liste déroulante",
  multiselect: "Choix multiples",
  boolean: "Oui / Non",
  number: "Nombre",
  url: "URL",
  code: "Code",
};

export const promptVariableSchema = z.object({
  key: z
    .string()
    .min(1, "Clé requise.")
    // Le même jeu de caractères que VARIABLE_PATTERN dans lib/prompts :
    // une clé qui ne peut pas s'écrire {{ainsi}} dans le contenu serait une
    // variable que rien ne peut remplacer.
    .regex(/^[a-zA-Z0-9_.-]+$/, "Lettres, chiffres, tiret, point et souligné uniquement."),
  label: z.string().max(120, "120 caractères maximum.").optional().or(z.literal("")),
  type: z.enum(VARIABLE_TYPES),
  defaultValue: z.string().optional().or(z.literal("")),
  placeholder: z.string().max(160, "160 caractères maximum.").optional().or(z.literal("")),
  description: z.string().max(300, "300 caractères maximum.").optional().or(z.literal("")),
  options: z.array(z.string()),
  required: z.boolean(),
});

export type PromptVariableInput = z.infer<typeof promptVariableSchema>;

export const promptInputSchema = z.object({
  title: z.string().min(3, "3 caractères minimum."),
  slug: z.string().max(80, "80 caractères maximum.").optional().or(z.literal("")),
  description: z.string().max(300, "300 caractères maximum.").optional().or(z.literal("")),
  content: z.string().min(1, "Un prompt vide n'a rien à donner."),
  categoryId: z.string().optional().or(z.literal("")),
  type: z.enum(PROMPT_TYPES),
  targetTool: z.enum(TARGET_TOOLS),
  status: z.enum(PROMPT_STATUSES),
  parentPromptId: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  collectionIds: z.array(z.string()),
  variables: z.array(promptVariableSchema),
  /** Accompagne la version créée par cet enregistrement, quand le contenu a
   *  changé. Vide, la version existe quand même : une note manquante ne
   *  doit pas faire perdre l'historique. */
  changeNote: z.string().max(160, "160 caractères maximum.").optional().or(z.literal("")),
});

export type PromptInput = z.infer<typeof promptInputSchema>;

export const EMPTY_PROMPT: PromptInput = {
  title: "",
  slug: "",
  description: "",
  content: "",
  categoryId: "",
  type: "build",
  targetTool: "claude_code",
  status: "draft",
  parentPromptId: "",
  tags: [],
  collectionIds: [],
  variables: [],
  changeNote: "",
};

export const promptBlockSchema = z.object({
  name: z.string().min(3, "3 caractères minimum."),
  description: z.string().max(200, "200 caractères maximum.").optional().or(z.literal("")),
  content: z.string().min(1, "Un bloc vide n'apporte rien."),
  category: z.string().max(60, "60 caractères maximum.").optional().or(z.literal("")),
  status: z.enum(["draft", "active", "archived"]),
});

export type PromptBlockInput = z.infer<typeof promptBlockSchema>;
