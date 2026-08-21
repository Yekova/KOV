"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { updateLeadNotes, convertLeadToClient } from "../actions";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function LeadDetailActions({
  leadId,
  initialNotes,
  convertedProfileId,
}: {
  leadId: string;
  initialNotes: string | null;
  convertedProfileId: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSavingNotes, startSavingNotes] = useTransition();
  const [isConverting, startConverting] = useTransition();
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
            <Button
              type="button"
              variant="primary"
              disabled={isConverting}
              onClick={() => {
                if (!window.confirm("Convertir ce lead en client ? Un email d'invitation lui sera envoyé pour créer son accès.")) return;
                setError(null);
                startConverting(async () => {
                  try {
                    await convertLeadToClient(leadId);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "La conversion a échoué.");
                  }
                });
              }}
            >
              {isConverting ? "Conversion…" : "Convertir en client"}
            </Button>
            <p className="text-kov-steel text-xs mt-2">
              Crée un compte client et envoie un email d&apos;invitation pour définir son mot de passe.
            </p>
          </>
        )}
      </section>

      {error && <p className="text-kov-red text-sm">{error}</p>}
    </div>
  );
}
