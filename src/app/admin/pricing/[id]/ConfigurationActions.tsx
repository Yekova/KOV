"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { duplicateConfiguration, markConfigurationLost } from "../new/actions";

export function ConfigurationActions({
  configurationId,
  status,
}: {
  configurationId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateConfiguration(configurationId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Chiffrage dupliqué.");
      router.push(`/admin/pricing/${result.configurationId}`);
    });
  }

  async function handleLost() {
    setSaving(true);
    const result = await markConfigurationLost(configurationId, reason);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Chiffrage marqué perdu.");
    setLostOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={pending}
        className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors disabled:opacity-50"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        {pending ? "…" : "Dupliquer en v+1"}
      </button>

      {status !== "lost" && (
        <button
          type="button"
          onClick={() => setLostOpen(true)}
          className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          Marquer perdu
        </button>
      )}

      <Modal open={lostOpen} onClose={() => setLostOpen(false)} title="Marquer ce chiffrage perdu" size="sm">
        <div className="space-y-4">
          <div>
            <label className={FIELD_LABEL} htmlFor="lost-reason">
              Motif <span className="text-kov-red">*</span>
            </label>
            <input
              id="lost-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Budget, délai, concurrent, sans réponse…"
              className={`${FIELD_CLASS} mt-1`}
              style={FIELD_STYLE}
            />
            {/* Le motif n'est pas une formalité : c'est la seule donnée qui
                permettra de savoir, dans six mois, ce qu'on perd et pourquoi. */}
            <p className="text-kov-steel text-[11px] mt-1">
              C&apos;est ce qu&apos;on relira pour comprendre ce qu&apos;on perd, et sur quoi.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLost}
              disabled={saving || !reason.trim()}
              className="px-5 py-2.5 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {saving ? "…" : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => setLostOpen(false)}
              className="px-5 py-2.5 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
