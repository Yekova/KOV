"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
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
  const [converting, setConverting] = useState(false);

  // L'ancien « Enregistré ✓ » posé à la main disparaît : le cycle du
  // bouton (cercle qui se ferme) plus le toast disent la même chose, dans
  // la langue du reste de l'application.
  const saveNotes = useKovAction({
    success: "Notes enregistrées.",
    fallbackError: "L'enregistrement a échoué.",
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-3">Notes internes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Notes visibles uniquement par l'équipe KOV…"
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        />
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <KovActionButton
            type="button"
            variant="secondary"
            state={saveNotes.state}
            onStateSettled={saveNotes.reset}
            successLabel="Enregistré"
            onClick={() => {
              saveNotes.run(async () => {
                const formData = new FormData();
                formData.set("notes", notes);
                await updateLeadNotes(leadId, formData);
              });
            }}
          >
            Enregistrer les notes
          </KovActionButton>
          {saveNotes.error && (
            <p role="alert" className="text-kov-red text-xs">
              {saveNotes.error}
            </p>
          )}
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
    </div>
  );
}
