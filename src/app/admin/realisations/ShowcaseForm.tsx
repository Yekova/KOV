"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RichEditor } from "@/components/admin/content/RichEditor";
import { ImagePicker } from "@/components/admin/content/ImagePicker";
import { Button } from "@/components/ui/Button";
import {
  createShowcaseProject,
  getShowcaseProjectById,
  updateShowcaseProject,
} from "./actions";
import { EMPTY_SHOWCASE, showcaseInputSchema, type ShowcaseInput } from "./schema";
import { VideoField } from "./VideoField";

const FIELD =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";
const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" } as const;
const LABEL = "text-xs uppercase tracking-widest text-kov-steel";

/** A comma-separated line in, an array out. Tags, deliverables and gallery
 *  images are all short lists an admin types rather than builds, and a
 *  dedicated chip editor for three of them would be three more components
 *  to maintain for no behaviour the form does not already have. */
function ListField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        value={value.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean)
          )
        }
        className={`${FIELD} mt-1`}
        style={FIELD_STYLE}
      />
      {hint && <p className="text-kov-steel text-xs mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="border p-5 space-y-4"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <h2 className="font-display text-kov-bone text-sm uppercase tracking-widest">{title}</h2>
      {children}
    </section>
  );
}

export function ShowcaseForm({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["showcase", projectId],
    queryFn: () => getShowcaseProjectById(projectId as string),
    enabled: Boolean(projectId),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ShowcaseInput>({
    resolver: zodResolver(showcaseInputSchema),
    defaultValues: EMPTY_SHOWCASE,
  });

  useEffect(() => {
    if (existing) reset(existing);
  }, [existing, reset]);

  // useWatch, not watch(): the React compiler skips a whole component that
  // calls the latter, which is why PostForm reaches for this one too.
  const kind = useWatch({ control, name: "kind" });

  async function onSubmit(input: ShowcaseInput) {
    setSaving(true);
    setError(null);
    const result = projectId
      ? await updateShowcaseProject(projectId, input)
      : await createShowcaseProject(input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(projectId ? "Réalisation enregistrée" : "Réalisation créée");
    router.push("/admin/realisations");
  }

  if (projectId && isLoading) {
    return (
      <div className="flex items-center gap-2 text-kov-steel text-sm">
        <Loader2 size={16} className="animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── What the project is ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Identité">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem] gap-4">
              <div>
                <label className={LABEL}>Nom</label>
                <input {...register("name")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
                {errors.name && <p className="text-kov-red text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className={LABEL}>Numéro</label>
                <input {...register("reference")} placeholder="01" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
                {errors.reference && <p className="text-kov-red text-xs mt-1">{errors.reference.message}</p>}
              </div>
            </div>

            <div>
              <label className={LABEL}>Domaine</label>
              <input {...register("category")} placeholder="Gestion de patrimoine" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              {errors.category && <p className="text-kov-red text-xs mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className={LABEL}>Slug</label>
              <input {...register("slug")} placeholder="Laissé vide, dérivé du nom" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              <p className="text-kov-steel text-xs mt-1">L&apos;ancre sur /projets et l&apos;URL d&apos;aperçu.</p>
            </div>

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <ListField label="Étiquettes" hint="Séparées par des virgules." value={field.value} onChange={field.onChange} />
              )}
            />

            <div>
              <label className={LABEL}>Accroche</label>
              <input {...register("tagline")} placeholder="Clarté et confiance" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>

            <div>
              <label className={LABEL}>Résumé</label>
              <textarea {...register("summary")} rows={3} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              <p className="text-kov-steel text-xs mt-1">
                Pour une réalisation à venir : ce qu&apos;elle est, quand il n&apos;y a pas encore de résultat à
                raconter.
              </p>
            </div>
          </Section>

          {/* ── The story, which is all-or-nothing on the page ─────────── */}
          <Section title="Le récit">
            <p className="text-kov-steel text-xs leading-relaxed">
              Les trois lignes s&apos;affichent ensemble ou pas du tout : un problème sans résultat est
              exactement le rendu à moitié rempli que la page évite. Un brouillon peut n&apos;en contenir
              qu&apos;une.
            </p>
            <div>
              <label className={LABEL}>Problème</label>
              <input {...register("narrativeProblem")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>
            <div>
              <label className={LABEL}>Système</label>
              <input {...register("narrativeSystem")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>
            <div>
              <label className={LABEL}>Résultat</label>
              <input {...register("narrativeResult")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>

            <div>
              <label className={LABEL}>Contexte (fiche)</label>
              <Controller
                control={control}
                name="brief"
                render={({ field }) => <RichEditor value={field.value ?? ""} onChange={field.onChange} />}
              />
            </div>

            <div>
              <label className={LABEL}>Description longue (fiche)</label>
              <Controller
                control={control}
                name="detail"
                render={({ field }) => <RichEditor value={field.value ?? ""} onChange={field.onChange} />}
              />
            </div>

            <Controller
              control={control}
              name="deliverables"
              render={({ field }) => (
                <ListField
                  label="Livré"
                  hint="Ce qui a été remis, séparé par des virgules. Des faits sur la livraison, jamais des chiffres sur l'activité du client."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>

          <Section title="Images">
            <div>
              <label className={LABEL}>Visuel principal</label>
              <Controller
                control={control}
                name="image"
                render={({ field }) => <ImagePicker value={field.value ?? ""} onChange={field.onChange} />}
              />
            </div>
            <div>
              <label className={LABEL}>Capture de la page</label>
              <p className="text-kov-steel text-xs mb-1">
                Ce qui va dans le cadre navigateur. Sans elle, le visuel principal est utilisé — mais une maquette
                d&apos;appareil dans un cadre de navigateur est une maquette deux fois.
              </p>
              <Controller
                control={control}
                name="screen"
                render={({ field }) => <ImagePicker value={field.value ?? ""} onChange={field.onChange} />}
              />
            </div>
            <div>
              <label className={LABEL}>Marque au survol</label>
              <p className="text-kov-steel text-xs mb-1">
                Le logo du client, qui sort de la carte en trois exemplaires au survol sur /projets. PNG à fond
                transparent — il est posé sur la page, pas dans un cadre. Sans lui, la carte ne fait rien au
                survol, ce qui est un état normal et non un manque.
              </p>
              <Controller
                control={control}
                name="hoverLogo"
                render={({ field }) => <ImagePicker value={field.value ?? ""} onChange={field.onChange} />}
              />
            </div>
            <Controller
              control={control}
              name="gallery"
              render={({ field }) => (
                <ListField
                  label="Galerie"
                  hint="URLs, séparées par des virgules. Uniquement des images de ce projet."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>
        </div>

        {/* ── How and where it appears ────────────────────────────────── */}
        <div className="space-y-6">
          <Section title="Publication">
            <div>
              <label className={LABEL}>Statut</label>
              <select {...register("publication")} className={`${FIELD} mt-1`} style={FIELD_STYLE}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Type</label>
              <select {...register("kind")} className={`${FIELD} mt-1`} style={FIELD_STYLE}>
                <option value="live">Livré</option>
                <option value="upcoming">À venir</option>
                <option value="invitation">Invitation</option>
              </select>
              {kind !== "live" && (
                <p className="text-kov-steel text-xs mt-1">
                  Seules les réalisations livrées ouvrent une fiche.
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-kov-bone text-sm">
              <input type="checkbox" {...register("showOnHome")} className="accent-kov-red w-4 h-4" />
              Afficher sur l&apos;accueil
            </label>
            <label className="flex items-center gap-2 text-kov-bone text-sm">
              <input type="checkbox" {...register("featured")} className="accent-kov-red w-4 h-4" />
              Mise en avant (hero)
            </label>
          </Section>

          <Section title="Liens">
            <div>
              <label className={LABEL}>Le projet</label>
              <input {...register("href")} placeholder="https://… ou /studio" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              {errors.href && <p className="text-kov-red text-xs mt-1">{errors.href.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Étude de cas</label>
              <input {...register("caseStudyHref")} placeholder="/journal/…" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
              {errors.caseStudyHref && <p className="text-kov-red text-xs mt-1">{errors.caseStudyHref.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Lieu</label>
              <input {...register("location")} placeholder="Talence, 33400, Gironde" className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>
          </Section>

          <Section title="Vidéo">
            <Controller
              control={control}
              name="videoPath"
              render={({ field: pathField }) => (
                <Controller
                  control={control}
                  name="videoPoster"
                  render={({ field: posterField }) => (
                    <Controller
                      control={control}
                      name="videoWidth"
                      render={({ field: widthField }) => (
                        <Controller
                          control={control}
                          name="videoHeight"
                          render={({ field: heightField }) => (
                            <Controller
                              control={control}
                              name="videoDuration"
                              render={({ field: durationField }) => (
                                <VideoField
                                  projectId={projectId ?? null}
                                  value={{
                                    path: pathField.value ?? "",
                                    poster: posterField.value ?? "",
                                    width: widthField.value,
                                    height: heightField.value,
                                    duration: durationField.value ?? "",
                                  }}
                                  onChange={(next) => {
                                    pathField.onChange(next.path);
                                    posterField.onChange(next.poster);
                                    widthField.onChange(next.width);
                                    heightField.onChange(next.height);
                                    durationField.onChange(next.duration);
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          </Section>

          <Section title="Preuves">
            <p className="text-kov-steel text-xs leading-relaxed">
              Rien ici n&apos;est obligatoire, et rien ne doit être estimé. Un chiffre n&apos;existe que mesuré et
              attribuable ; un témoignage, que s&apos;il vient d&apos;une personne réelle qui accepte d&apos;être
              nommée.
            </p>
            <div>
              <label className={LABEL}>Témoignage</label>
              <textarea {...register("testimonialQuote")} rows={3} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>
            <div>
              <label className={LABEL}>Auteur du témoignage</label>
              <input {...register("testimonialAuthor")} className={`${FIELD} mt-1`} style={FIELD_STYLE} />
            </div>
          </Section>
        </div>
      </div>

      {error && (
        <p className="border-l-2 border-kov-red pl-3 text-kov-red text-sm">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Enregistrement…" : projectId ? "Enregistrer" : "Créer"}
        </Button>
        <Link href="/admin/realisations" className="text-kov-steel hover:text-kov-bone text-sm transition-colors">
          Annuler
        </Link>
      </div>
    </form>
  );
}
