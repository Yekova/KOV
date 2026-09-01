import { z } from "zod";

// Shared by react-hook-form (client, via zodResolver) and the Server
// Actions (server-side re-validation — client-side checks are UX only,
// never trusted on their own, same "defense in depth" convention as every
// other form in this codebase). relatedPostIds is intentionally NOT in
// this schema — the spec keeps it out of react-hook-form, managed as its
// own useState array and merged into the payload right before submit.
export const postInputSchema = z.object({
  title: z.string().min(5, "5 caractères minimum."),
  excerpt: z.string().min(20, "20 caractères minimum."),
  body: z.string().optional().or(z.literal("")),
  image: z.string().min(1, "Image de couverture requise."),
  tag: z.string().min(1, "Catégorie requise."),
  dateLabel: z.string().min(1, "Date requise."),
  readingTime: z
    .string()
    .regex(/^\d+\s*(min|h)$/, 'Format attendu : "5 min" ou "1 h".'),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  slug: z.string().max(80, "80 caractères maximum.").optional().or(z.literal("")),
  metaTitle: z.string().max(60, "60 caractères maximum.").optional().or(z.literal("")),
  metaDescription: z.string().max(155, "155 caractères maximum.").optional().or(z.literal("")),
  authorName: z.string().max(80, "80 caractères maximum.").optional().or(z.literal("")),
  audioUrl: z.string().url("URL invalide.").optional().or(z.literal("")),
  projectId: z.string().optional().or(z.literal("")),
  clientDisplayName: z.string().optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postInputSchema>;

export const relatedPostIdsSchema = z.array(z.string()).max(3, "3 articles liés maximum.");
