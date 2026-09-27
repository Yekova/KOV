"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { FIELD_CLASS, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { ConfirmDialog } from "@/components/admin/clients/ConfirmDialog";
import { formatEuros } from "@/lib/pricing/money";
import { archiveBenchmark, updateBenchmark } from "../actions";
import type { BenchmarkRow } from "@/lib/pricing/catalog";

// La nature d'une référence n'est pas un détail de rangement : une
// statistique de plateforme et trois profils regardés un par un ne se citent
// pas de la même façon devant un client, et il faut pouvoir le voir sans
// ouvrir la source.
const NATURE_LABELS: Record<BenchmarkRow["nature"], string> = {
  platform_statistic: "Statistique de plateforme",
  individual_observation: "Observation individuelle",
  commercial_page: "Page commerciale",
  secondary_source: "Source secondaire",
};

const UNIT_SUFFIX: Record<BenchmarkRow["unit"], string> = {
  day: "par jour",
  project: "par projet",
  month: "par mois",
};

// L'âge se calcule contre une date fournie par le serveur, jamais contre
// l'horloge du navigateur : un composant qui lit l'heure pendant son rendu
// peut afficher un nombre au rendu serveur et un autre à l'hydratation, et
// le décalage tombe précisément à minuit, quand personne ne regarde.
function ageInDays(consultedAt: string, todayIso: string): number {
  const today = new Date(`${todayIso}T00:00:00`).getTime();
  return Math.floor((today - new Date(`${consultedAt}T00:00:00`).getTime()) / 86_400_000);
}

export function BenchmarksManager({
  benchmarks,
  stalenessDays,
  todayIso,
}: {
  benchmarks: BenchmarkRow[];
  stalenessDays: number;
  todayIso: string;
}) {
  const stale = benchmarks.filter((benchmark) => ageInDays(benchmark.consultedAt, todayIso) > stalenessDays);

  return (
    <div className="space-y-4">
      {stale.length > 0 && (
        <GlassCard className="p-5">
          <p className="text-kov-bone text-sm">
            {stale.length} référence{stale.length > 1 ? "s" : ""} de plus de {stalenessDays} jours.
          </p>
          <p className="text-kov-steel text-xs mt-1">
            Rouvrir la source, relire la valeur, mettre la date à jour. Une référence périmée citée dans un devis
            est pire qu&apos;une référence absente.
          </p>
        </GlassCard>
      )}

      {benchmarks.length === 0 ? (
        <p className="text-kov-steel text-sm">Aucune référence saisie.</p>
      ) : (
        benchmarks.map((benchmark) => (
          <BenchmarkRowForm
            key={benchmark.id}
            benchmark={benchmark}
            stalenessDays={stalenessDays}
            todayIso={todayIso}
          />
        ))
      )}
    </div>
  );
}

function BenchmarkRowForm({
  benchmark,
  stalenessDays,
  todayIso,
}: {
  benchmark: BenchmarkRow;
  stalenessDays: number;
  todayIso: string;
}) {
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const age = ageInDays(benchmark.consultedAt, todayIso);
  const isStale = age > stalenessDays;

  const [state, action, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const result = await updateBenchmark(benchmark.id, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Référence mise à jour.");
      return result;
    },
    { error: null }
  );

  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-kov-bone text-sm">
            {benchmark.label}
            {benchmark.seniority && <span className="text-kov-steel"> · {benchmark.seniority}</span>}
            {benchmark.zone && <span className="text-kov-steel"> · {benchmark.zone}</span>}
          </p>
          <p className="text-kov-steel text-[11px] mt-0.5">
            {NATURE_LABELS[benchmark.nature]} · {benchmark.source}
            {benchmark.sourceUrl && (
              <>
                {" · "}
                <a
                  href={benchmark.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-kov-red transition-colors underline"
                >
                  ouvrir la source
                </a>
              </>
            )}
          </p>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: isStale ? "var(--kov-red)" : "var(--kov-steel)" }}>
          {age} jours
        </span>
      </div>

      <form action={action} className="grid gap-3 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-3">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`value-${benchmark.id}`}>
            Valeur (€ {UNIT_SUFFIX[benchmark.unit]})
          </label>
          <input
            id={`value-${benchmark.id}`}
            name="value"
            defaultValue={(benchmark.valueCents / 100).toString()}
            inputMode="decimal"
            className={`${FIELD_CLASS} mt-1 tabular-nums`}
            style={FIELD_STYLE}
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`max-${benchmark.id}`}>
            Borne haute
          </label>
          <input
            id={`max-${benchmark.id}`}
            name="value_max"
            defaultValue={benchmark.valueMaxCents === null ? "" : (benchmark.valueMaxCents / 100).toString()}
            inputMode="decimal"
            placeholder="—"
            className={`${FIELD_CLASS} mt-1 tabular-nums`}
            style={FIELD_STYLE}
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`date-${benchmark.id}`}>
            Consultée le
          </label>
          <input
            id={`date-${benchmark.id}`}
            name="consulted_at"
            type="date"
            defaultValue={benchmark.consultedAt}
            className={`${FIELD_CLASS} mt-1`}
            style={FIELD_STYLE}
          />
        </div>

        <input type="hidden" name="source_url" value={benchmark.sourceUrl ?? ""} />

        <div className="sm:col-span-3 flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 border px-3 py-2 text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            {pending ? "…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingArchive(true)}
            className="border px-3 py-2 text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            Archiver
          </button>
        </div>
      </form>

      {state.error && <p className="text-kov-red text-xs mt-2">{state.error}</p>}

      {benchmark.valueMaxCents !== null && (
        <p className="text-kov-steel text-[11px] mt-2 tabular-nums">
          Fourchette : {formatEuros(benchmark.valueCents)} à {formatEuros(benchmark.valueMaxCents)}{" "}
          {UNIT_SUFFIX[benchmark.unit]}.
        </p>
      )}

      <ConfirmDialog
        open={confirmingArchive}
        title="Archiver cette référence ?"
        body="Elle disparaît des écrans mais reste en base : un devis signé qui s'appuyait dessus doit rester explicable."
        confirmLabel="Archiver"
        pending={archiving}
        error={archiveError}
        onCancel={() => {
          setConfirmingArchive(false);
          setArchiveError(null);
        }}
        onConfirm={() => {
          setArchiving(true);
          setArchiveError(null);
          void archiveBenchmark(benchmark.id)
            .then((result) => {
              if (result.error) {
                setArchiveError(result.error);
                return;
              }
              toast.success("Référence archivée.");
              setConfirmingArchive(false);
            })
            .finally(() => setArchiving(false));
        }}
      />
    </GlassCard>
  );
}
