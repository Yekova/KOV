"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FIELD_CLASS, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { convertLeadToClient } from "../actions";
import { KOV_PHASES } from "@/lib/process/phases";

type PickerOption = { id: string; label: string };

// La conversion d'un lead en client, en un seul geste.
//
// Avant : une confirmation window.confirm, une action, aucune redirection.
// L'admin devait relire la page, cliquer vers la fiche client, faire défiler
// jusqu'au quatrième bloc et remplir un formulaire qui n'affichait ni état
// d'envoi ni message d'erreur. Trois pages pour une seule intention.
//
// Ici, trois étapes qui ne quittent jamais l'écran. Ce n'est pas une route
// (/admin/leads/[id]/convert) parce que le geste dure trente secondes et
// part d'une liste : perdre sa position est précisément ce qu'on cherche à
// éviter. Le garde-fou contre la fermeture accidentelle couvre le risque
// qu'une route aurait réglé autrement.
export function ConvertLeadFlow({
  leadId,
  lead,
  admins,
  onDone,
}: {
  leadId: string;
  lead: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    assignedTo: string | null;
    projectType: string | null;
    budgetCents: number | null;
    message: string | null;
  };
  admins: PickerOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState({
    fullName: lead.name,
    email: lead.email,
    company: lead.company ?? "",
    phone: lead.phone ?? "",
    accountManagerId: lead.assignedTo ?? "",
  });

  const [withProject, setWithProject] = useState(true);
  const [project, setProject] = useState({
    // Pré-rempli depuis ce que le lead a déjà dit, jamais deviné : si le
    // type de projet est vide, le champ l'est aussi et reste obligatoire.
    name: lead.company ? `${lead.company} — Site web` : "",
    category: lead.projectType ?? "",
    budgetEur: lead.budgetCents !== null ? String(lead.budgetCents / 100) : "",
    description: lead.message ?? "",
    withDefaultPhases: true,
  });

  function close() {
    // Un abandon après l'étape 1 perd une saisie : on le demande.
    if (step > 1 && !window.confirm("Abandonner la conversion ? Rien ne sera créé.")) return;
    onDone();
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await convertLeadToClient(leadId, {
          fullName: client.fullName,
          email: client.email,
          company: client.company || null,
          phone: client.phone || null,
          accountManagerId: client.accountManagerId || null,
          project: withProject
            ? {
                name: project.name,
                category: project.category,
                budgetEur: project.budgetEur || null,
                description: project.description || null,
                withDefaultPhases: project.withDefaultPhases,
              }
            : null,
        });

        if (result.projectError) {
          // Le client existe, le projet non. On ne défait rien : l'email
          // d'invitation est parti et ne se dé-envoie pas.
          toast.error(`Client créé, mais le projet n'a pas pu l'être : ${result.projectError}`);
        } else {
          toast.success(result.projectId ? "Client et projet créés" : "Client créé");
        }
        router.push(result.projectId ? `/admin/projects/${result.projectId}` : `/admin/clients/${result.clientId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "La conversion a échoué.");
      }
    });
  }

  const canContinue =
    step === 1
      ? Boolean(client.fullName.trim() && client.email.trim())
      : step === 2
        ? !withProject || Boolean(project.name.trim() && project.category.trim())
        : true;

  return (
    <Modal open onClose={close} title="Convertir en client" size="lg" closeOnBackdrop={false}>
      <p className="text-kov-steel text-xs uppercase tracking-widest mb-5">Étape {step} sur 3</p>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-kov-concrete text-sm">
            Un email d&apos;invitation sera envoyé à cette adresse pour que le client crée son accès.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom complet" required>
              <Input value={client.fullName} onChange={(e) => setClient({ ...client, fullName: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
            </Field>
            <Field label="Entreprise">
              <Input value={client.company} onChange={(e) => setClient({ ...client, company: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              {/* Le responsable de compte se réglait jusqu'ici depuis un
                  formulaire isolé sur une autre page, sans aucun retour —
                  et la carte « votre interlocuteur » du client restait vide
                  tant que personne n'y pensait. C'est le bon moment. */}
              <Field label="Responsable de compte" hint="Affiché au client dans son espace.">
                <Select
                  name="account_manager_id"
                  value={client.accountManagerId}
                  onChange={(v) => setClient({ ...client, accountManagerId: v })}
                  options={[{ value: "", label: "— Aucun —" }, ...admins.map((a) => ({ value: a.id, label: a.label }))]}
                  className={FIELD_CLASS}
                  style={FIELD_STYLE}
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-kov-bone text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={withProject}
              onChange={(e) => setWithProject(e.target.checked)}
              className="accent-kov-red"
            />
            Créer un premier projet tout de suite
          </label>

          {withProject && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom du projet" required>
                <Input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
              </Field>
              <Field label="Catégorie" required>
                <Input value={project.category} onChange={(e) => setProject({ ...project, category: e.target.value })} />
              </Field>
              <Field label="Budget (€)" hint="Repris du lead.">
                <Input value={project.budgetEur} onChange={(e) => setProject({ ...project, budgetEur: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" hint="Reprise du message du lead.">
                  <Textarea rows={3} value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-2 text-kov-concrete text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.withDefaultPhases}
                    onChange={(e) => setProject({ ...project, withDefaultPhases: e.target.checked })}
                    className="accent-kov-red mt-0.5"
                  />
                  <span>
                    Créer les {KOV_PHASES.length} phases KOV
                    <span className="block text-kov-steel text-xs mt-0.5">
                      Les phases font foi pour l&apos;avancement affiché au client : sans elles, sa première
                      connexion montre une carte vide au lieu d&apos;une frise.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Ce qui sera créé</p>
            <ul className="space-y-1.5 text-kov-concrete text-sm">
              <li>Un compte client pour {client.fullName}</li>
              <li>Une invitation envoyée à {client.email}</li>
              {client.accountManagerId && <li>Un responsable de compte assigné</li>}
              {withProject && <li>Le projet « {project.name} »</li>}
              {withProject && project.withDefaultPhases && <li>{KOV_PHASES.length} phases</li>}
              <li className="text-kov-steel">Les devis du lead seront rattachés au client</li>
            </ul>
          </div>
          <div>
            {/* La colonne qui fait remarquer ce qu'on a oublié. */}
            <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Ce que le client verra</p>
            <ul className="space-y-1.5 text-kov-concrete text-sm">
              <li>Un message de bienvenue dans son fil d&apos;activité</li>
              {withProject ? (
                <li>
                  Son projet à 0 %{project.withDefaultPhases ? `, avec ses ${KOV_PHASES.length} étapes` : ", sans étapes"}
                </li>
              ) : (
                <li className="text-kov-steel">Aucun projet</li>
              )}
              {client.accountManagerId ? (
                <li>Son interlocuteur chez KOV</li>
              ) : (
                <li className="text-kov-steel">Aucun interlocuteur affiché</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="text-kov-red text-sm mt-4">{error}</p>}

      <div className="flex items-center justify-between gap-4 mt-8">
        <button
          type="button"
          onClick={step === 1 ? close : () => setStep(step - 1)}
          disabled={isPending}
          className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors disabled:opacity-40"
        >
          {step === 1 ? "Annuler" : "← Retour"}
        </button>

        {step < 3 ? (
          <Button type="button" variant="primary" onClick={() => setStep(step + 1)} disabled={!canContinue}>
            Continuer →
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={submit} disabled={isPending}>
            {isPending ? "Conversion…" : "Convertir"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
