"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Field";
import { createClientSpace, type CreateSpaceResult } from "@/app/admin/clients/createSpace";
import "./clientSpaceWizard.css";

// L'assistant de création d'un espace client.
//
// Trois écrans et un récapitulatif, parce que ce sont trois décisions
// différentes : qui, sur quel projet, et avec quoi de préparé. Les poser
// sur un seul formulaire en ferait une liste de vingt champs dont la
// moitié ne concerne pas celui qui la remplit.
//
// ── LE RÉCAPITULATIF N'EST PAS DÉCORATIF ─────────────────────────────
//
// C'est l'écran qui fait remarquer qu'on a oublié le responsable de
// compte, ou coché « phases » sur un projet qui n'en veut pas. Il montre
// aussi ce que le client verra — et, après création, le lien d'accès,
// qui est la seule porte de sortie quand l'email n'arrive pas.

type Step = "client" | "project" | "review" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "project", label: "Projet" },
  { id: "review", label: "Récapitulatif" },
];

interface AdminOption {
  id: string;
  name: string;
}

const EMPTY = {
  email: "",
  fullName: "",
  company: "",
  phone: "",
  accountManagerId: "",
  withProject: true,
  projectName: "",
  projectCategory: "",
  withPhases: true,
  withValidation: true,
};

export function ClientSpaceWizard({
  open,
  onClose,
  admins,
  /** Pré-remplissage depuis une fiche existante, quand l'assistant est
   *  ouvert pour un client déjà saisi. */
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  admins: AdminOption[];
  prefill?: Partial<typeof EMPTY>;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("client");
  const [values, setValues] = useState({ ...EMPTY, ...prefill });
  const [result, setResult] = useState<CreateSpaceResult | null>(null);
  const [linkShown, setLinkShown] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const created = await createClientSpace({
        email: values.email,
        fullName: values.fullName,
        company: values.company || null,
        phone: values.phone || null,
        accountManagerId: values.accountManagerId || null,
        project: values.withProject
          ? {
              name: values.projectName,
              category: values.projectCategory,
              projectManagerId: values.accountManagerId || null,
              withPhases: values.withPhases,
              withValidation: values.withValidation,
            }
          : null,
      });

      if (created.error) {
        toast.error(created.error);
        return;
      }
      setResult(created);
      setStep("done");
      // Le projet a pu échouer alors que le client existe : on le dit
      // plutôt que de laisser découvrir l'absence plus tard.
      if (created.projectError) toast.error(`Client créé, mais : ${created.projectError}`);
      else toast.success("Espace client créé.");
      router.refresh();
    });
  }

  function close() {
    onClose();
    // Remis à zéro APRÈS fermeture : rouvrir sur le récapitulatif d'une
    // création précédente laisserait croire qu'on va la refaire.
    setStep("client");
    setValues({ ...EMPTY, ...prefill });
    setResult(null);
    setLinkShown(false);
  }

  const clientReady = values.email.trim() !== "" && values.fullName.trim() !== "";
  const projectReady =
    !values.withProject || (values.projectName.trim() !== "" && values.projectCategory.trim() !== "");
  const managerName = admins.find((a) => a.id === values.accountManagerId)?.name ?? null;

  return (
    <Modal open={open} onClose={close} title="Créer l'espace client" size="lg" closeOnBackdrop={false}>
      {step !== "done" && (
        <ol className="kov-wiz__steps">
          {STEPS.map((entry, index) => (
            <li
              key={entry.id}
              className="kov-wiz__step"
              data-current={entry.id === step || undefined}
              data-passed={STEPS.findIndex((s) => s.id === step) > index || undefined}
            >
              <span className="kov-wiz__bullet">{index + 1}</span>
              {entry.label}
            </li>
          ))}
        </ol>
      )}

      {step === "client" && (
        <div className="kov-wiz__body">
          <div className="kov-wiz__grid">
            <Field label="Nom complet" required>
              <Input value={values.fullName} onChange={(e) => set("fullName", e.target.value)} autoFocus />
            </Field>
            <Field label="Email" required hint="C'est son identifiant de connexion.">
              <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Société">
              <Input value={values.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" />
            </Field>
          </div>

          <Field label="Responsable de compte" hint="C'est son visage et son nom dans l'espace client.">
            <select
              value={values.accountManagerId}
              onChange={(e) => set("accountManagerId", e.target.value)}
              className="kov-wiz__select"
            >
              <option value="">— Aucun pour l&apos;instant</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </Field>

          <Footer
            onNext={() => setStep("project")}
            nextDisabled={!clientReady}
            onCancel={close}
          />
        </div>
      )}

      {step === "project" && (
        <div className="kov-wiz__body">
          <label className="kov-wiz__check">
            <input
              type="checkbox"
              checked={values.withProject}
              onChange={(e) => set("withProject", e.target.checked)}
            />
            <span>
              Créer un premier projet
              <span className="kov-wiz__hint">
                Sans projet, l&apos;espace reste vide jusqu&apos;à ce qu&apos;on lui en associe un.
              </span>
            </span>
          </label>

          {values.withProject && (
            <>
              <div className="kov-wiz__grid">
                <Field label="Nom du projet" required>
                  <Input
                    value={values.projectName}
                    onChange={(e) => set("projectName", e.target.value)}
                    placeholder="Site web — Maison Dupont"
                  />
                </Field>
                <Field label="Catégorie" required>
                  <Input
                    value={values.projectCategory}
                    onChange={(e) => set("projectCategory", e.target.value)}
                    placeholder="Site vitrine"
                  />
                </Field>
              </div>

              <label className="kov-wiz__check">
                <input
                  type="checkbox"
                  checked={values.withPhases}
                  onChange={(e) => set("withPhases", e.target.checked)}
                />
                <span>
                  Créer les phases KOV
                  <span className="kov-wiz__hint">
                    Les sept étapes du processus. Ce sont elles qui font l&apos;avancement affiché au client — sans
                    elles, il voit une frise vide.
                  </span>
                </span>
              </label>

              <label className="kov-wiz__check">
                <input
                  type="checkbox"
                  checked={values.withValidation}
                  onChange={(e) => set("withValidation", e.target.checked)}
                />
                <span>
                  Préparer l&apos;espace de validation
                  <span className="kov-wiz__hint">
                    Crée une première page, masquée au client. Elle s&apos;ouvrira à lui quand vous y publierez une
                    maquette.
                  </span>
                </span>
              </label>
            </>
          )}

          <Footer
            onBack={() => setStep("client")}
            onNext={() => setStep("review")}
            nextDisabled={!projectReady}
            onCancel={close}
          />
        </div>
      )}

      {step === "review" && (
        <div className="kov-wiz__body">
          <dl className="kov-wiz__review">
            <div>
              <dt>Client</dt>
              <dd>
                {values.fullName}
                {values.company && <span className="text-kov-steel"> · {values.company}</span>}
              </dd>
            </div>
            <div>
              <dt>Connexion</dt>
              <dd>{values.email}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              {/* Un vide se dit. C'est l'écran qui doit faire remarquer
                  l'oubli, pas le client trois jours plus tard. */}
              <dd className={managerName ? "" : "text-kov-steel"}>{managerName ?? "Aucun — à choisir plus tard"}</dd>
            </div>
            <div>
              <dt>Projet</dt>
              <dd className={values.withProject ? "" : "text-kov-steel"}>
                {values.withProject ? `${values.projectName} · ${values.projectCategory}` : "Aucun pour l'instant"}
              </dd>
            </div>
            {values.withProject && (
              <div>
                <dt>Préparé</dt>
                <dd>
                  {[values.withPhases && "les 7 phases", values.withValidation && "l'espace de validation"]
                    .filter(Boolean)
                    .join(" et ") || "rien de plus"}
                </dd>
              </div>
            )}
          </dl>

          <p className="kov-wiz__note">
            À la création, une invitation part à {values.email}. Elle ne contient aucun mot de passe : le client
            définira le sien à sa première connexion.
          </p>

          <Footer
            onBack={() => setStep("project")}
            onSubmit={submit}
            submitLabel={pending ? "Création…" : "Créer l'espace"}
            pending={pending}
            onCancel={close}
          />
        </div>
      )}

      {step === "done" && result && (
        <div className="kov-wiz__body">
          <p className="kov-wiz__done">Espace client créé.</p>

          <dl className="kov-wiz__review">
            <div>
              <dt>Connexion</dt>
              <dd>{values.email}</dd>
            </div>
            <div>
              <dt>Invitation</dt>
              <dd className={result.emailSent ? "" : "text-kov-red"}>
                {result.emailSent ? "Envoyée" : `Non envoyée — ${result.emailError ?? "raison inconnue"}`}
              </dd>
            </div>
            <div>
              <dt>Projet</dt>
              <dd className={result.projectError ? "text-kov-red" : ""}>
                {result.projectError ?? (result.projectId ? values.projectName : "Aucun")}
              </dd>
            </div>
          </dl>

          {/* Le lien n'apparaît pas d'emblée : il ouvre un accès au compte
              de quelqu'un, il n'a rien à faire en permanence sur un écran
              qu'on laisse ouvert. Même règle que le panneau d'invitation. */}
          {result.actionLink && (
            <div className="kov-wiz__link">
              {linkShown ? (
                <>
                  <p className="kov-wiz__hint">
                    Lien d&apos;activation, à transmettre à la main si l&apos;email n&apos;arrive pas. Usage unique.
                  </p>
                  <code>{result.actionLink}</code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(result.actionLink!);
                      toast.success("Lien copié.");
                    }}
                    className="kov-wiz__ghost"
                  >
                    Copier
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setLinkShown(true)} className="kov-wiz__ghost">
                  Afficher le lien d&apos;activation
                </button>
              )}
            </div>
          )}

          <div className="kov-wiz__footer">
            <button type="button" onClick={close} className="kov-wiz__ghost">
              Fermer
            </button>
            {result.clientId && (
              <Link href={`/admin/clients/${result.clientId}`} className="kov-wiz__cta" onClick={close}>
                Voir l&apos;espace client
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Footer({
  onBack,
  onNext,
  onSubmit,
  onCancel,
  nextDisabled,
  submitLabel,
  pending,
}: {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onCancel: () => void;
  nextDisabled?: boolean;
  submitLabel?: string;
  pending?: boolean;
}) {
  return (
    <div className="kov-wiz__footer">
      <button type="button" onClick={onCancel} className="kov-wiz__ghost">
        Annuler
      </button>
      {onBack && (
        <button type="button" onClick={onBack} className="kov-wiz__ghost">
          Retour
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled} className="kov-wiz__cta">
          Continuer
        </button>
      )}
      {onSubmit && (
        <button type="button" onClick={onSubmit} disabled={pending} className="kov-wiz__cta">
          {submitLabel}
        </button>
      )}
    </div>
  );
}
