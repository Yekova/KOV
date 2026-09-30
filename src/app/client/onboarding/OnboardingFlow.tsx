"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Portrait } from "@/components/ui/Portrait";
import { KovProgress } from "@/components/ui/KovProgress";
import { Field, Input } from "@/components/ui/Field";
import { PASSWORD_RULES, passwordScore } from "@/lib/clients/password";
import { ONBOARDING_STEPS, STEP_LABELS, type OnboardingState, type OnboardingStep } from "@/lib/clients/onboardingSteps";
import {
  confirmProfile,
  finishOnboarding,
  seeProject,
  seeWelcome,
  setInitialPassword,
  updateAndConfirmProfile,
} from "./actions";
import "./onboarding.css";

// La première connexion d'un client.
//
// ── CE QUI EST OBLIGATOIRE, ET CE QUI NE L'EST PAS ───────────────────
//
// Une seule étape ne se saute pas : la sécurité (§41). C'est la seule qui
// laisse le compte dans un état différent selon qu'on l'a franchie — un
// compte né d'un lien d'invitation n'a PAS de mot de passe, et sans elle
// il n'en aurait jamais. Les quatre autres ne font que montrer, donc le
// bouton « Passer » y est offert plutôt que refusé.
//
// ── LA REPRISE ───────────────────────────────────────────────────────
//
// L'étape de départ vient du serveur, déduite des horodatages. Revenir
// trois jours plus tard reprend au même endroit, sans rien conserver dans
// le navigateur — et sans qu'un changement d'appareil perde la place.

interface ProfileValues {
  fullName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  createdAt: string | null;
}

interface ProjectSummary {
  id: string;
  name: string;
  category: string;
  statusLabel: string;
  phaseName: string | null;
  progressPercent: number;
  hasValidation: boolean;
}

const VISIBLE_STEPS = ONBOARDING_STEPS;

export function OnboardingFlow({
  startAt,
  state,
  profile,
  manager,
  project,
}: {
  startAt: OnboardingStep;
  state: OnboardingState;
  profile: ProfileValues;
  manager: { fullName: string | null; title: string | null; avatarUrl: string | null } | null;
  project: ProjectSummary | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(startAt);
  const [pending, startTransition] = useTransition();
  const firstName = profile.fullName?.trim().split(" ")[0] ?? null;

  function advance(to: OnboardingStep, work?: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      if (work) {
        const result = await work();
        if (result.error) {
          toast.error(result.error);
          return;
        }
      }
      setStep(to);
    });
  }

  return (
    <div className="kov-onb">
      <ol className="kov-onb__steps" aria-label="Étapes de votre première connexion">
        {VISIBLE_STEPS.map((id, index) => {
          const current = id === step;
          const passed = VISIBLE_STEPS.indexOf(step) > index;
          return (
            <li key={id} className="kov-onb__step" data-current={current || undefined} data-passed={passed || undefined}>
              <span className="kov-onb__bullet">{passed ? "✓" : index + 1}</span>
              <span className="kov-onb__step-label">{STEP_LABELS[id]}</span>
            </li>
          );
        })}
      </ol>

      {step === "welcome" && (
        <section className="kov-onb__panel">
          <h1 className="kov-onb__title">
            Bienvenue chez KOV{firstName ? `, ${firstName}` : ""}
            <span className="text-kov-red">.</span>
          </h1>
          <p className="kov-onb__lede">
            Votre espace personnel est prêt. Quelques vérifications et vous pourrez commencer.
          </p>

          <dl className="kov-onb__facts">
            {project && (
              <div>
                <dt>Votre projet</dt>
                <dd>{project.name}</dd>
              </div>
            )}
            {manager && (
              <div>
                <dt>Votre interlocuteur</dt>
                <dd className="kov-onb__person">
                  <Portrait src={manager.avatarUrl} name={manager.fullName} size={28} />
                  <span>
                    {manager.fullName ?? "Équipe KOV"}
                    {manager.title && <span className="text-kov-concrete"> · {manager.title}</span>}
                  </span>
                </dd>
              </div>
            )}
            {profile.createdAt && (
              <div>
                <dt>Espace créé le</dt>
                <dd>{new Date(profile.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</dd>
              </div>
            )}
          </dl>

          <div className="kov-onb__actions">
            <button type="button" disabled={pending} className="kov-onb__cta" onClick={() => advance("profile", seeWelcome)}>
              Commencer
            </button>
          </div>
        </section>
      )}

      {step === "profile" && (
        <ProfileStep
          profile={profile}
          pending={pending}
          verifiedAt={state.profileVerifiedAt}
          onConfirm={() => advance("security", confirmProfile)}
          onSave={(formData) => advance("security", () => updateAndConfirmProfile(formData))}
        />
      )}

      {step === "security" && (
        <SecurityStep
          pending={pending}
          alreadyDone={state.securityDoneAt !== null}
          onDone={(password, confirmation) => advance("project", () => setInitialPassword(password, confirmation))}
          onSkipBecauseDone={() => setStep("project")}
        />
      )}

      {step === "project" && (
        <section className="kov-onb__panel">
          <h2 className="kov-onb__title">Votre projet<span className="text-kov-red">.</span></h2>

          {project ? (
            <>
              <p className="kov-onb__project-name">{project.name}</p>
              <p className="kov-onb__lede">{project.category}</p>

              <dl className="kov-onb__facts">
                <div>
                  <dt>Statut</dt>
                  <dd>{project.statusLabel}</dd>
                </div>
                {project.phaseName && (
                  <div>
                    <dt>Phase actuelle</dt>
                    <dd>{project.phaseName}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-5">
                <KovProgress percent={project.progressPercent} label={`Avancement de ${project.name}`} />
              </div>

              {project.hasValidation ? (
                <div className="kov-onb__card">
                  <p className="kov-onb__card-title">Espace de validation</p>
                  <p className="kov-onb__card-text">
                    Consultez les maquettes, laissez vos commentaires à l&apos;endroit exact qui vous gêne, et validez
                    chaque étape.
                  </p>
                  <Link href={`/client/projects/${project.id}/validation`} className="kov-onb__link">
                    Ouvrir l&apos;espace de validation →
                  </Link>
                </div>
              ) : (
                <p className="kov-onb__note">Votre espace de validation sera disponible prochainement.</p>
              )}
            </>
          ) : (
            // §49 : rien n'est inventé quand il n'y a pas encore de projet.
            <p className="kov-onb__lede">
              Votre espace est prêt. Votre premier projet apparaîtra ici dès son lancement.
            </p>
          )}

          <div className="kov-onb__actions">
            <button type="button" disabled={pending} className="kov-onb__cta" onClick={() => advance("done", seeProject)}>
              Continuer
            </button>
          </div>
        </section>
      )}

      {step === "done" && (
        <section className="kov-onb__panel">
          <h2 className="kov-onb__title">Votre espace KOV est prêt<span className="text-kov-red">.</span></h2>

          <ul className="kov-onb__checklist">
            <li data-done={state.profileVerifiedAt !== null || undefined}>Informations vérifiées</li>
            <li data-done={state.securityDoneAt !== null || undefined}>Compte sécurisé</li>
            <li data-done={project !== null || undefined}>
              {project ? "Projet associé" : "Projet à venir"}
            </li>
            <li data-done={project?.hasValidation || undefined}>
              {project?.hasValidation ? "Espace de validation disponible" : "Espace de validation à venir"}
            </li>
          </ul>

          <div className="kov-onb__actions">
            <button
              type="button"
              disabled={pending}
              className="kov-onb__cta"
              onClick={() =>
                startTransition(async () => {
                  const result = await finishOnboarding();
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  router.push("/client");
                })
              }
            >
              {pending ? "Un instant…" : "Accéder à mon tableau de bord"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ── ÉTAPE 2 : LES INFORMATIONS ───────────────────────────────────────

function ProfileStep({
  profile,
  pending,
  verifiedAt,
  onConfirm,
  onSave,
}: {
  profile: ProfileValues;
  pending: boolean;
  verifiedAt: string | null;
  onConfirm: () => void;
  onSave: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);

  const rows: { label: string; value: string | null }[] = [
    { label: "Nom", value: profile.fullName },
    { label: "Société", value: profile.company },
    { label: "Fonction", value: profile.jobTitle },
    { label: "Email", value: profile.email },
    { label: "Téléphone", value: profile.phone },
    {
      label: "Adresse de facturation",
      value: [profile.street, [profile.postalCode, profile.city].filter(Boolean).join(" "), profile.country]
        .filter(Boolean)
        .join(", ") || null,
    },
  ];

  if (!editing) {
    return (
      <section className="kov-onb__panel">
        <h2 className="kov-onb__title">Vos informations<span className="text-kov-red">.</span></h2>
        <p className="kov-onb__lede">Ces informations sont-elles toujours à jour&nbsp;?</p>

        <dl className="kov-onb__facts">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              {/* Un champ vide se dit, il ne se remplit pas d'un tiret
                  décoratif : c'est justement ce qu'on demande de compléter. */}
              <dd className={row.value ? "" : "text-kov-steel"}>{row.value ?? "À compléter"}</dd>
            </div>
          ))}
        </dl>

        {verifiedAt && (
          <p className="kov-onb__note">
            Déjà confirmées le {new Date(verifiedAt).toLocaleDateString("fr-FR")}.
          </p>
        )}

        <div className="kov-onb__actions">
          <button type="button" className="kov-onb__ghost" onClick={() => setEditing(true)}>
            Modifier
          </button>
          <button type="button" disabled={pending} className="kov-onb__cta" onClick={onConfirm}>
            Tout est correct
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="kov-onb__panel">
      <h2 className="kov-onb__title">Vos informations<span className="text-kov-red">.</span></h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(new FormData(event.currentTarget));
        }}
      >
        <div className="kov-onb__grid">
          <Field label="Nom">
            <Input name="full_name" defaultValue={profile.fullName ?? ""} required autoComplete="name" />
          </Field>
          <Field label="Société">
            <Input name="company" defaultValue={profile.company ?? ""} autoComplete="organization" />
          </Field>
          <Field label="Fonction">
            <Input name="display_title" defaultValue={profile.jobTitle ?? ""} autoComplete="organization-title" />
          </Field>
          <Field label="Téléphone">
            <Input name="phone" defaultValue={profile.phone ?? ""} autoComplete="tel" inputMode="tel" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Adresse">
              <Input name="address_street" defaultValue={profile.street ?? ""} autoComplete="address-line1" />
            </Field>
          </div>
          <Field label="Code postal">
            <Input name="address_postal_code" defaultValue={profile.postalCode ?? ""} autoComplete="postal-code" />
          </Field>
          <Field label="Ville">
            <Input name="address_city" defaultValue={profile.city ?? ""} autoComplete="address-level2" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Pays">
              <Input name="address_country" defaultValue={profile.country ?? ""} autoComplete="country-name" />
            </Field>
          </div>
        </div>

        {/* L'email ne se modifie pas ici : il EST l'identifiant de connexion,
            et le changer demande de reconfirmer la nouvelle adresse. Le
            studio s'en charge, pour ne pas laisser quelqu'un s'enfermer
            dehors au milieu de sa première connexion. */}
        <p className="kov-onb__note">
          Votre adresse de connexion reste {profile.email}. Pour la changer, écrivez au studio.
        </p>

        <div className="kov-onb__actions">
          <button type="button" className="kov-onb__ghost" onClick={() => setEditing(false)}>
            Annuler
          </button>
          <button type="submit" disabled={pending} className="kov-onb__cta">
            Enregistrer et continuer
          </button>
        </div>
      </form>
    </section>
  );
}

// ── ÉTAPE 3 : LA SÉCURITÉ ────────────────────────────────────────────

function SecurityStep({
  pending,
  alreadyDone,
  onDone,
  onSkipBecauseDone,
}: {
  pending: boolean;
  alreadyDone: boolean;
  onDone: (password: string, confirmation: string) => void;
  onSkipBecauseDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const score = passwordScore(password);

  return (
    <section className="kov-onb__panel">
      <h2 className="kov-onb__title">Sécurisez votre compte<span className="text-kov-red">.</span></h2>
      <p className="kov-onb__lede">
        Votre lien d&apos;invitation vous a ouvert la porte une fois. Choisissez maintenant un mot de passe pour
        revenir quand vous voulez.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDone(password, confirmation);
        }}
      >
        <div className="kov-onb__grid">
          <Field label="Mot de passe">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirmation">
            <Input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <div className="kov-onb__meter" aria-hidden="true">
          <span style={{ width: `${(score.met / score.total) * 100}%` }} data-full={score.met === score.total || undefined} />
        </div>

        <ul className="kov-onb__rules">
          {PASSWORD_RULES.map((rule) => (
            <li key={rule.label} data-met={rule.met(password) || undefined}>
              {rule.label}
            </li>
          ))}
        </ul>

        <div className="kov-onb__actions">
          {/* Le seul contournement possible, et il n'en est pas un : un
              client qui a DÉJÀ défini son mot de passe n'a rien à refaire.
              Aucun bouton « passer » quand ce n'est pas le cas. */}
          {alreadyDone && (
            <button type="button" className="kov-onb__ghost" onClick={onSkipBecauseDone}>
              Garder mon mot de passe actuel
            </button>
          )}
          <button type="submit" disabled={pending || score.met < score.total} className="kov-onb__cta">
            Enregistrer et continuer
          </button>
        </div>
      </form>
    </section>
  );
}
