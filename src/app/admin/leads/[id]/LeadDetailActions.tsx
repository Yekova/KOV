"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FIELD_CLASS } from "@/components/ui/fieldStyles";
import { updateLeadNotes } from "../actions";
import { ConvertLeadFlow } from "./ConvertLeadFlow";

type PickerOption = { id: string; label: string };

export function LeadDetailActions({
  leadId,
  initialNotes,
  convertedProfileId,
  lead,
  admins,
}: {
  leadId: string;
  initialNotes: string | null;
  convertedProfileId: string | null;
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
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSavingNotes, startSavingNotes] = useTransition();
  const [converting, setConverting] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-3">Notes internes</h2>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesSaved(false);
          }}
          rows={5}
          placeholder="Notes visibles uniquement par l'équipe KOV…"
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        />
        <div className="flex items-center gap-3 mt-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isSavingNotes}
            onClick={() => {
              setError(null);
              startSavingNotes(async () => {
                try {
                  const formData = new FormData();
                  formData.set("notes", notes);
                  await updateLeadNotes(leadId, formData);
                  setNotesSaved(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
                }
              });
            }}
          >
            {isSavingNotes ? "Enregistrement…" : "Enregistrer les notes"}
          </Button>
          {notesSaved && !isSavingNotes && <span className="text-kov-steel text-xs">Enregistré ✓</span>}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-3">Conversion</h2>
        {convertedProfileId ? (
          <p className="text-kov-steel text-sm">
            Déjà converti en client —{" "}
            <Link href={`/admin/clients/${convertedProfileId}`} className="text-kov-red hover:underline">
              voir la fiche client →
            </Link>
          </p>
        ) : (
          <>
            {/* Le window.confirm a disparu : la conversion crée un compte,
                envoie un email et peut créer un projet — trois décisions
                qu'une boîte « OK / Annuler » ne permet pas de prendre. */}
            <Button type="button" variant="primary" onClick={() => setConverting(true)}>
              Convertir en client
            </Button>
            <p className="text-kov-steel text-xs mt-2">
              Crée le compte, envoie l&apos;invitation, rattache les devis du lead, et peut créer le premier
              projet avec ses phases.
            </p>
            {converting && (
              <ConvertLeadFlow
                leadId={leadId}
                lead={lead}
                admins={admins}
                onDone={() => setConverting(false)}
              />
            )}
          </>
        )}
      </section>

      {error && <p className="text-kov-red text-sm">{error}</p>}
    </div>
  );
}
