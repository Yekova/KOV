"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateSettingsVersion } from "./actions";
import type { PricingSettings } from "@/lib/pricing/types";

// Les paramètres d'une version tarifaire.
//
// Les montants se saisissent en euros et les taux en pourcentage, parce que
// c'est ainsi qu'ils sont discutés avec un expert-comptable. La conversion
// en centimes et en points de base se fait dans l'action serveur : la base
// n'a jamais à voir un flottant.

function euros(cents: number): string {
  return (cents / 100).toString();
}

function percent(bp: number): string {
  return (bp / 100).toString();
}

export function SettingsVersionForm({ versionId, settings }: { versionId: string; settings: PricingSettings }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => {
      const result = await updateSettingsVersion(versionId, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Paramètres enregistrés.");
      return result;
    },
    { error: null }
  );

  return (
    <form action={action}>
      <GlassCard className="p-6 space-y-8">
        <section>
          <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-1">Coût de revient</h2>
          <p className="text-kov-steel text-xs mb-4">
            Ces cinq champs produisent le coût de revient journalier. Rien d&apos;autre ne le fixe.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={settings.regime === "micro" ? "Revenu net visé (€/an)" : "Rémunération nette (€/an)"}
              required
            >
              <Input name="target_net_income" defaultValue={euros(settings.targetNetIncomeCents)} inputMode="decimal" />
            </Field>
            <Field
              label="Taux de cotisations (%)"
              required
              hint={
                settings.regime === "micro"
                  ? "Assis sur le chiffre d'affaires."
                  : "Assis sur la rémunération."
              }
            >
              <Input name="contribution_rate" defaultValue={percent(settings.contributionRateBp)} inputMode="decimal" />
            </Field>
            <Field label="Charges fixes (€/an)" required>
              <Input name="fixed_costs" defaultValue={euros(settings.fixedCostsCents)} inputMode="decimal" />
            </Field>
            <Field label="Amortissements (€/an)" required>
              <Input name="depreciation" defaultValue={euros(settings.depreciationCents)} inputMode="decimal" />
            </Field>
            <Field label="Jours facturables (par an)" required>
              <Input name="billable_days" defaultValue={String(settings.billableDays)} inputMode="decimal" />
            </Field>
          </div>

          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              name="contribution_rate_confirmed"
              defaultChecked={settings.contributionRateConfirmed}
              className="mt-1 accent-[var(--kov-red)]"
            />
            <span>
              <span className="text-kov-bone text-sm">Taux de cotisations confirmé par un expert-comptable</span>
              <span className="block text-kov-steel text-xs mt-0.5">
                Tant que cette case est décochée, chaque chiffrage le signale. Le coût de revient bloque la
                génération d&apos;un devis : une estimation ne doit pas être présentée comme un fait.
              </span>
            </span>
          </label>
        </section>

        <section className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-1">Coefficients</h2>
          <p className="text-kov-steel text-xs mb-4">
            L&apos;indexation déplace ensemble les taux de vente, les prix de référence, les bandes de marché et
            les abonnements. Un seul coefficient, pas deux jeux de chiffres à tenir d&apos;accord.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Indexation vs 2027 (%)" hint="0 pour l'année de base.">
              <Input name="indexation" defaultValue={percent(settings.indexationBp)} inputMode="decimal" />
            </Field>
            <Field label="Majoration des coûts externes (%)" required>
              <Input name="external_uplift" defaultValue={percent(settings.externalUpliftBp)} inputMode="decimal" />
            </Field>
            <Field label="Majoration petit projet (%)" required>
              <Input name="small_project" defaultValue={percent(settings.smallProjectBp)} inputMode="decimal" />
            </Field>
            <Field label="Seuil petit projet (jours)" required>
              <Input
                name="small_project_threshold"
                defaultValue={String(settings.smallProjectThresholdDays)}
                inputMode="decimal"
              />
            </Field>
          </div>
        </section>

        <section className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-1">Garde-fous</h2>
          <p className="text-kov-steel text-xs mb-4">
            Ce qui déclenche une alerte, et ce qui bloque un devis.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="TJM plancher (€)" required>
              <Input name="floor_day_rate" defaultValue={euros(settings.floorDayRateCents)} inputMode="decimal" />
            </Field>
            <Field label="Marge cible (%)" required>
              <Input name="target_margin" defaultValue={percent(settings.targetMarginBp)} inputMode="decimal" />
            </Field>
            <Field label="Remise maximale (%)" required hint="Au-delà, la génération est refusée.">
              <Input name="max_discount" defaultValue={percent(settings.maxDiscountBp)} inputMode="decimal" />
            </Field>
            <Field label="Taux hors périmètre (€/jour)" required>
              <Input
                name="out_of_scope_day_rate"
                defaultValue={euros(settings.outOfScopeDayRateCents)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Validité des devis (jours)" required>
              <Input name="quote_validity_days" defaultValue={String(settings.quoteValidityDays)} inputMode="numeric" />
            </Field>
          </div>
        </section>

        <section className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-1">TVA</h2>
          <p className="text-kov-steel text-xs mb-4">
            En franchise, le devis porte la mention et aucun taux. Le seuil de prestations de services est de{" "}
            {(settings.franchiseThresholdCents / 100).toLocaleString("fr-FR")} € (majoré à{" "}
            {(settings.franchiseIncreasedThresholdCents / 100).toLocaleString("fr-FR")} €).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Régime" required>
              <select
                name="vat_regime"
                defaultValue={settings.vatRegime}
                className="w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                <option value="franchise">Franchise en base</option>
                <option value="standard">Assujetti</option>
              </select>
            </Field>
            <Field label="Taux de TVA (%)" required>
              <Input name="vat_rate" defaultValue={percent(settings.vatRateBp)} inputMode="decimal" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-1">
              <Field label="Mention de franchise">
                <Input name="vat_exemption_mention" defaultValue={settings.vatExemptionMention ?? ""} />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4 border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {state.error && <p className="text-kov-red text-sm">{state.error}</p>}
        </div>
      </GlassCard>
    </form>
  );
}
