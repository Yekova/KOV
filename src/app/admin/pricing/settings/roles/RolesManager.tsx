"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { FIELD_CLASS, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { indexCents, formatEuros } from "@/lib/pricing/money";
import { updateRole } from "../actions";
import type { PricingRole } from "@/lib/pricing/types";

// Un formulaire par ligne plutôt qu'un gros formulaire unique.
//
// Modifier un taux est une action isolée : on vient changer UN chiffre après
// une discussion, pas dix. Un enregistrement global obligerait à relire
// toutes les lignes pour savoir ce qui a bougé, et ferait perdre les autres
// modifications si une seule ligne était refusée.

export function RolesManager({
  roles,
  indexationBp,
  internalDayRateCents,
}: {
  roles: PricingRole[];
  indexationBp: number;
  internalDayRateCents: number;
}) {
  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <RoleRow
          key={role.code}
          role={role}
          indexationBp={indexationBp}
          internalDayRateCents={internalDayRateCents}
        />
      ))}
    </div>
  );
}

function RoleRow({
  role,
  indexationBp,
  internalDayRateCents,
}: {
  role: PricingRole;
  indexationBp: number;
  internalDayRateCents: number;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const result = await updateRole(role.code, formData);
      if (result.error) toast.error(result.error);
      else toast.success(`${role.code} enregistré.`);
      return result;
    },
    { error: null }
  );

  const indexedSell = indexCents(role.sellRateCents, indexationBp);
  // Le fait que la spec assume : certains rôles se vendent sous le coût d'un
  // freelance. L'afficher ici, à côté des deux nombres, évite de le
  // redécouvrir à chaque devis.
  const sellsUnderFreelance = role.freelanceCostCents !== null && role.sellRateCents < role.freelanceCostCents;
  const sellsUnderCost = indexedSell < internalDayRateCents;

  return (
    <GlassCard className="p-4">
      <form action={action} className="grid gap-3 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-1">
          <p className="text-kov-steel text-[11px] uppercase tracking-widest">Code</p>
          <p className="text-kov-bone text-sm mt-2 tabular-nums">{role.code}</p>
        </div>

        <div className="lg:col-span-4">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`label-${role.code}`}>
            Libellé
          </label>
          <input
            id={`label-${role.code}`}
            name="label"
            defaultValue={role.label}
            className={`${FIELD_CLASS} mt-1`}
            style={FIELD_STYLE}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`sell-${role.code}`}>
            Vente (€/j)
          </label>
          <input
            id={`sell-${role.code}`}
            name="sell_rate"
            defaultValue={(role.sellRateCents / 100).toString()}
            inputMode="decimal"
            className={`${FIELD_CLASS} mt-1 tabular-nums`}
            style={FIELD_STYLE}
          />
          {indexationBp !== 0 && (
            <p className="text-kov-steel text-[11px] mt-1 tabular-nums">indexé {formatEuros(indexedSell)}</p>
          )}
        </div>

        <div className="lg:col-span-2">
          <label className="text-kov-steel text-[11px] uppercase tracking-widest" htmlFor={`free-${role.code}`}>
            Freelance (€/j)
          </label>
          <input
            id={`free-${role.code}`}
            name="freelance_cost"
            defaultValue={role.freelanceCostCents === null ? "" : (role.freelanceCostCents / 100).toString()}
            inputMode="decimal"
            placeholder={role.internalOnly ? "interne" : "—"}
            className={`${FIELD_CLASS} mt-1 tabular-nums`}
            style={FIELD_STYLE}
          />
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="internal_only" defaultChecked={role.internalOnly} className="accent-[var(--kov-red)]" />
            <span className="text-kov-concrete text-xs">Interne uniquement</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="default_subcontracted"
              defaultChecked={role.defaultSubcontracted}
              className="accent-[var(--kov-red)]"
            />
            <span className="text-kov-concrete text-xs">Sous-traité par défaut</span>
          </label>
        </div>

        <div className="lg:col-span-1">
          <button
            type="submit"
            disabled={pending}
            className="w-full border px-3 py-2 text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            {pending ? "…" : "OK"}
          </button>
        </div>
      </form>

      {(sellsUnderFreelance || sellsUnderCost || state.error) && (
        <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: "var(--kov-border)" }}>
          {state.error && <p className="text-kov-red text-xs">{state.error}</p>}
          {sellsUnderFreelance && (
            <p className="text-kov-steel text-xs">
              Vendu {formatEuros(role.sellRateCents)} pour un freelance à {formatEuros(role.freelanceCostCents!)} :
              sous-traiter ce rôle coûte {formatEuros(role.freelanceCostCents! - role.sellRateCents)} par jour.
            </p>
          )}
          {sellsUnderCost && (
            <p className="text-kov-steel text-xs">
              Taux indexé sous le coût de revient interne de {formatEuros(internalDayRateCents)} : chaque jour
              vendu à ce taux perd de l&apos;argent.
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}
