"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { AlertList } from "@/components/admin/pricing/AlertList";
import { duplicateConfiguration, markConfigurationLost } from "../actions";
import { DeleteConfigurationButton } from "@/components/admin/pricing/DeleteConfigurationButton";
import { generateQuoteFromConfiguration } from "./actions";
import type { PricingAlert } from "@/lib/pricing/alerts";

export function ConfigurationActions({
  configurationId,
  title,
  status,
  hasQuote,
  blockingCount,
}: {
  configurationId: string;
  title: string;
  status: string;
  hasQuote: boolean;
  /** Nombre d'alertes bloquantes au recalcul du jour. Sert UNIQUEMENT à
   *  annoncer la dérogation avant le clic ; c'est le serveur qui tranche,
   *  et lui seul. Un écran qui se tromperait ici ferait au pire une
   *  promesse de trop, jamais un devis de trop. */
  blockingCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [savingLost, setSavingLost] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [blockingAlerts, setBlockingAlerts] = useState<PricingAlert[] | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

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

  async function generate(withOverride?: string) {
    setGenerating(true);
    const result = await generateQuoteFromConfiguration(configurationId, withOverride);
    setGenerating(false);

    // Un refus bloquant n'est pas une erreur de saisie : on montre CE QUI
    // bloque, avec son correctif, plutôt qu'un toast rouge qui disparaît
    // avant d'avoir été lu.
    if (result.blockingAlerts) {
      setBlockingAlerts(result.blockingAlerts);
      return;
    }
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBlockingAlerts(null);
    setOverrideReason("");
    toast.success(`Devis ${result.reference} généré.`);
    router.refresh();
  }

  const canGenerate = !hasQuote && status === "draft";

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <div className="flex flex-wrap gap-2">
        {canGenerate && (
          <button
            type="button"
            onClick={() => generate()}
            disabled={generating}
            className="px-5 py-2.5 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {generating ? "Génération…" : "Générer le devis"}
          </button>
        )}

        {/* Tant qu'aucun devis n'est sorti, un chiffrage est un brouillon :
            on le corrige. Après, il explique un document numéroté et parti,
            et c'est « Dupliquer en v+1 » qui prend le relais. */}
        {canGenerate && (
          <Link
            href={`/admin/pricing/${configurationId}/edit`}
            className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            Modifier
          </Link>
        )}

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={pending}
          className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          {pending ? "…" : "Dupliquer en v+1"}
        </button>

        {status !== "lost" && !hasQuote && (
          <button
            type="button"
            onClick={() => setLostOpen(true)}
            className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            Marquer perdu
          </button>
        )}

        {!hasQuote && (
          <DeleteConfigurationButton
            configurationId={configurationId}
            title={title}
            redirectTo="/admin/pricing"
            label="Supprimer"
          />
        )}
      </div>

      {/* La dérogation existait, mais on ne pouvait l'apprendre qu'en
          cliquant sur un bouton qui vous refusait ensuite. Qui lisait
          « Bloquant » dans le récapitulatif en concluait qu'il n'y avait
          pas de devis possible, et n'essayait pas.
          On annonce donc l'issue AVANT le clic. Le garde-fou ne bouge
          pas : il faut toujours ouvrir la fenêtre et écrire un motif. */}
      {canGenerate && blockingCount > 0 && (
        <p className="text-kov-steel text-[11px] lg:text-right max-w-xs">
          {blockingCount === 1 ? "1 alerte bloquante" : `${blockingCount} alertes bloquantes`}. Le devis
          reste possible : la génération demandera une dérogation écrite, enregistrée avec votre nom et la
          date.
        </p>
      )}

      {/* ── La dérogation ──────────────────────────────────────────────── */}
      <Modal
        open={blockingAlerts !== null}
        onClose={() => setBlockingAlerts(null)}
        title="Ce chiffrage est bloqué"
        size="md"
        closeOnBackdrop={false}
      >
        <div className="space-y-5">
          <p className="text-kov-steel text-sm">
            La génération est refusée tant que ceci n&apos;est pas corrigé. Vous pouvez passer outre, mais le
            motif sera enregistré avec votre nom et la date.
          </p>

          {blockingAlerts && <AlertList alerts={blockingAlerts} />}

          <div>
            <label className={FIELD_LABEL} htmlFor="override-reason">
              Motif de la dérogation <span className="text-kov-red">*</span>
            </label>
            <input
              id="override-reason"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Projet de référence accepté à perte, validé le…"
              className={`${FIELD_CLASS} mt-1`}
              style={FIELD_STYLE}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generate(overrideReason)}
              disabled={generating || !overrideReason.trim()}
              className="px-5 py-2.5 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {generating ? "…" : "Générer malgré tout"}
            </button>
            <button
              type="button"
              onClick={() => setBlockingAlerts(null)}
              className="px-5 py-2.5 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              Revenir au chiffrage
            </button>
          </div>
        </div>
      </Modal>

      {/* ── La perte ───────────────────────────────────────────────────── */}
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
              onClick={async () => {
                setSavingLost(true);
                const result = await markConfigurationLost(configurationId, reason);
                setSavingLost(false);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Chiffrage marqué perdu.");
                setLostOpen(false);
                router.refresh();
              }}
              disabled={savingLost || !reason.trim()}
              className="px-5 py-2.5 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              {savingLost ? "…" : "Confirmer"}
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
