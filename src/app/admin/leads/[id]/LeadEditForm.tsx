"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FIELD_CLASS, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { updateLead, type LeadInput } from "../actions";
import { LEAD_TIMELINE_LABELS, LEAD_TIMELINES } from "@/lib/admin/status";

type PickerOption = { id: string; label: string };

// Le formulaire d'édition d'un lead — celui que la migration
// 20260901140100 promettait en commentaire et qui n'avait jamais été écrit.
//
// Trois sections, parce que les trente colonnes ne se lisent pas d'un seul
// tenant : qui c'est, ce qu'il veut, et où on en est avec lui.
//
// Deux champs ne se comportent pas comme les autres :
//   · le score est en lecture seule, il est calculé par recomputeLeadScore ;
//   · le consentement est modifiable, mais sa date est horodatée par
//     l'action et chaque changement laisse une trace dans la chronologie.
export function LeadEditForm({
  lead,
  admins,
}: {
  lead: Record<string, unknown>;
  admins: PickerOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const value = (key: string) => (lead[key] as string | null) ?? "";
  const budgetCents = lead.budget_cents as number | null;

  const [form, setForm] = useState<LeadInput>({
    title: value("title"),
    firstName: value("first_name"),
    lastName: value("last_name"),
    name: value("name"),
    email: value("email"),
    phone: value("phone"),
    company: value("company"),
    jobTitle: value("job_title"),
    website: value("website"),
    linkedinUrl: value("linkedin_url"),
    projectType: value("project_type"),
    timeline: value("timeline"),
    budgetEur: budgetCents !== null ? String(budgetCents / 100) : "",
    tags: (lead.tags as string[] | null) ?? [],
    nextActionNote: value("next_action_note"),
    nextActionDate: value("next_action_date"),
    nextActionOwnerId: value("next_action_owner_id"),
    consentStatus: value("consent_status") || "unknown",
    marketingOptIn: Boolean(lead.marketing_opt_in),
    notes: value("notes"),
  });

  const set = (patch: Partial<LeadInput>) => setForm((current) => ({ ...current, ...patch }));

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateLead(lead.id as string, form);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Lead enregistré");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors"
      >
        Modifier la fiche →
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <p className="font-display text-kov-bone text-sm uppercase tracking-widest">Identité</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Civilité">
            <Select
              name="title"
              value={form.title ?? ""}
              onChange={(v) => set({ title: v })}
              options={[
                { value: "", label: "—" },
                { value: "M.", label: "M." },
                { value: "Mme", label: "Mme" },
                { value: "Dr", label: "Dr" },
              ]}
              className={FIELD_CLASS}
              style={FIELD_STYLE}
            />
          </Field>
          <Field label="Fonction">
            <Input value={form.jobTitle ?? ""} onChange={(e) => set({ jobTitle: e.target.value })} />
          </Field>
          <Field label="Prénom" hint="Utilisé par les modèles d'emails pour la formule d'appel.">
            <Input value={form.firstName ?? ""} onChange={(e) => set({ firstName: e.target.value })} />
          </Field>
          <Field label="Nom">
            <Input value={form.lastName ?? ""} onChange={(e) => set({ lastName: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="Entreprise">
            <Input value={form.company ?? ""} onChange={(e) => set({ company: e.target.value })} />
          </Field>
          <Field label="Site">
            <Input value={form.website ?? ""} onChange={(e) => set({ website: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.linkedinUrl ?? ""} onChange={(e) => set({ linkedinUrl: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <p className="font-display text-kov-bone text-sm uppercase tracking-widest">Qualification</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type de projet">
            <Input value={form.projectType ?? ""} onChange={(e) => set({ projectType: e.target.value })} />
          </Field>
          <Field label="Budget (€)">
            <Input value={form.budgetEur ?? ""} onChange={(e) => set({ budgetEur: e.target.value })} />
          </Field>
          <Field label="Délai">
            <Select
              name="timeline"
              value={form.timeline ?? ""}
              onChange={(v) => set({ timeline: v })}
              options={[{ value: "", label: "—" }, ...LEAD_TIMELINES.map((t) => ({ value: t, label: LEAD_TIMELINE_LABELS[t] }))]}
              className={FIELD_CLASS}
              style={FIELD_STYLE}
            />
          </Field>
          <Field label="Score" hint="Calculé automatiquement, non modifiable.">
            <Input value={String((lead.score as number | null) ?? 0)} readOnly disabled />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Tags" hint="Séparés par une virgule.">
              <Input
                value={(form.tags ?? []).join(", ")}
                onChange={(e) =>
                  set({
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="font-display text-kov-bone text-sm uppercase tracking-widest">Suivi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prochaine action">
            <Input value={form.nextActionNote ?? ""} onChange={(e) => set({ nextActionNote: e.target.value })} />
          </Field>
          <Field label="Pour le">
            <Input type="date" value={form.nextActionDate ?? ""} onChange={(e) => set({ nextActionDate: e.target.value })} />
          </Field>
          <Field label="Qui s'en charge">
            <Select
              name="next_action_owner_id"
              value={form.nextActionOwnerId ?? ""}
              onChange={(v) => set({ nextActionOwnerId: v })}
              options={[{ value: "", label: "—" }, ...admins.map((a) => ({ value: a.id, label: a.label }))]}
              className={FIELD_CLASS}
              style={FIELD_STYLE}
            />
          </Field>
          <Field label="Consentement" hint="La date est horodatée automatiquement et le changement est tracé.">
            <Select
              name="consent_status"
              value={form.consentStatus ?? "unknown"}
              onChange={(v) => set({ consentStatus: v })}
              options={[
                { value: "unknown", label: "Inconnu" },
                { value: "given", label: "Donné" },
                { value: "withdrawn", label: "Retiré" },
              ]}
              className={FIELD_CLASS}
              style={FIELD_STYLE}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-kov-concrete text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.marketingOptIn)}
                onChange={(e) => set({ marketingOptIn: e.target.checked })}
                className="accent-kov-red"
              />
              Accepte les communications marketing
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes internes">
              <Textarea rows={4} value={form.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </div>
        </div>
      </section>

      {error && <p className="text-kov-red text-sm">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="button" variant="primary" onClick={save} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
