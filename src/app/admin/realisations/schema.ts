import { z } from "zod";

// Shared by react-hook-form (client, via zodResolver) and the Server Actions
// (server-side re-validation — client-side checks are UX only, never trusted
// on their own, same "defense in depth" convention as every other form in
// this codebase).

/** A destination that is either a route on this site or a real address.
 *
 *  Both are legitimate: KOV Virtual Studio points at /studio, Kanti at its
 *  own domain, and the card decides between a Link and a new tab from the
 *  same field. What is not legitimate is "www.something.com" with no scheme,
 *  which resolves as a relative path and 404s. */
const destination = z
  .string()
  .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\/.+/.test(value), {
    message: "Un chemin interne (/studio) ou une URL complète (https://…).",
  })
  .optional()
  .or(z.literal(""));

const optional = z.string().optional().or(z.literal(""));

export const showcaseInputSchema = z.object({
  name: z.string().min(2, "2 caractères minimum."),
  // Left empty, the action derives it from the name — same behaviour as the
  // journal form, where the slug only becomes manual once someone edits it.
  slug: z.string().max(80, "80 caractères maximum.").optional().or(z.literal("")),
  reference: z.string().min(1, "Requis.").max(4, "4 caractères maximum."),
  category: z.string().min(2, "2 caractères minimum."),
  tags: z.array(z.string().min(1)).max(6, "6 étiquettes maximum."),

  kind: z.enum(["live", "upcoming", "invitation"]),
  publication: z.enum(["draft", "published"]),
  showOnHome: z.boolean(),
  featured: z.boolean(),

  summary: optional,
  tagline: z.string().max(60, "60 caractères maximum.").optional().or(z.literal("")),
  detail: optional,
  brief: optional,

  // The narrative is all-or-nothing at render time, not at save time: a
  // draft must be able to hold one line while the other two are still being
  // written. The mapper in src/lib/showcase/projects.ts is what refuses to
  // build a half-filled one.
  narrativeProblem: optional,
  narrativeSystem: optional,
  narrativeResult: optional,

  deliverables: z.array(z.string().min(1)).max(10, "10 livrables maximum."),
  location: optional,
  href: destination,
  caseStudyHref: destination,

  image: optional,
  screen: optional,
  hoverLogo: optional,
  gallery: z.array(z.string().min(1)).max(8, "8 images maximum."),

  // Written by VideoField after a direct upload, never typed by hand: the
  // dimensions are read off the file itself, because they only exist to
  // reserve the frame and a wrong pair is a wrongly-shaped box.
  videoPath: optional,
  videoPoster: optional,
  videoWidth: z.number().int().positive().nullable(),
  videoHeight: z.number().int().positive().nullable(),
  videoDuration: optional,

  // Measured and attributable, or absent. Nothing here invents a figure:
  // the form starts empty and stays empty until someone has the analytics
  // open in front of them.
  metrics: z
    .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
    .max(4, "4 chiffres maximum."),
  testimonialQuote: optional,
  testimonialAuthor: optional,
});

export type ShowcaseInput = z.infer<typeof showcaseInputSchema>;

/** What a brand new project starts as. Published is deliberately not the
 *  default: a project is written, looked at, then put online. */
export const EMPTY_SHOWCASE: ShowcaseInput = {
  name: "",
  slug: "",
  reference: "",
  category: "",
  tags: [],
  kind: "live",
  publication: "draft",
  showOnHome: true,
  featured: false,
  summary: "",
  tagline: "",
  detail: "",
  brief: "",
  narrativeProblem: "",
  narrativeSystem: "",
  narrativeResult: "",
  deliverables: [],
  location: "",
  href: "",
  caseStudyHref: "",
  image: "",
  screen: "",
  hoverLogo: "",
  gallery: [],
  videoPath: "",
  videoPoster: "",
  videoWidth: null,
  videoHeight: null,
  videoDuration: "",
  metrics: [],
  testimonialQuote: "",
  testimonialAuthor: "",
};
