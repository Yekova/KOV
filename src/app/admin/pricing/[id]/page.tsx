import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { PricingSummary } from "@/components/admin/pricing/PricingSummary";
import { getOldestBenchmarkDate, getPricingCatalog } from "@/lib/pricing/catalog";
import { collectAlerts } from "@/lib/pricing/alerts";
import { priceConfiguration, type PricingResult } from "@/lib/pricing/engine";
import { buildQuoteDraft } from "@/lib/pricing/quoteMapping";
import { formatEuros } from "@/lib/pricing/money";
import type { PricingConditions, PricingSelection } from "@/lib/pricing/types";
import { ConfigurationActions } from "./ConfigurationActions";

export const metadata: Metadata = { title: "Chiffrage — Admin KOV" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  quoted: "Devis généré",
  lost: "Perdu",
};

export default async function PricingConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("pricing_configurations")
    .select("id, title, status, version, parent_id, segment, client_vat_regime, selection, conditions, snapshot, settings_version_id, client_id, lead_id, quote_id, lost_reason, override_reason, override_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const catalog = await getPricingCatalog(row.settings_version_id as string);
  if (!catalog) notFound();

  const selection = row.selection as unknown as PricingSelection;
  const conditions = row.conditions as unknown as PricingConditions;

  // L'instantané est ce qui a été chiffré, et c'est lui qu'on affiche : si
  // un taux a bougé depuis, le client a quand même reçu ce prix-là.
  const snapshot = row.snapshot as unknown as PricingResult | null;

  // Mais on recalcule à côté, pour pouvoir DIRE que les paramètres ont
  // changé. Un chiffrage qui vieillit sans le signaler est un chiffrage
  // qu'on ressort par erreur six mois plus tard.
  const current = priceConfiguration(catalog, selection, conditions);
  const drifted = snapshot !== null && snapshot.priceExclVatCents !== current.priceExclVatCents;

  const shown = snapshot ?? current;
  const oldestBenchmark = await getOldestBenchmarkDate();
  const alerts = collectAlerts(shown, catalog, selection, conditions, {
    oldestBenchmarkConsultedAt: oldestBenchmark,
    today: new Date(),
  });

  const draft = buildQuoteDraft(shown, conditions.displayMode ?? "round", []);

  const [{ data: client }, { data: lead }, { data: quote }] = await Promise.all([
    row.client_id
      ? supabaseAdmin.from("profiles").select("id, full_name, company").eq("id", row.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.lead_id
      ? supabaseAdmin.from("leads").select("id, name, company").eq("id", row.lead_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.quote_id
      ? supabaseAdmin.from("quotes").select("id, reference, status").eq("id", row.quote_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <main className="px-6 py-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/pricing"
            className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
          >
            ← Pricing
          </Link>
          <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">{row.title as string}</h1>
          <p className="text-kov-steel text-sm mt-1">
            {STATUS_LABELS[row.status as string] ?? (row.status as string)}
            {(row.version as number) > 1 && <> · version {row.version as number}</>}
            {" · "}
            {catalog.settings.label}
            {client && <> · {(client.company as string | null) ?? (client.full_name as string)}</>}
            {lead && <> · {(lead.company as string | null) ?? (lead.name as string)} (lead)</>}
            {row.segment && <> · {row.segment as string}</>}
          </p>
          {row.lost_reason && (
            <p className="text-kov-steel text-sm mt-2">Motif de perte : {row.lost_reason as string}</p>
          )}
          {/* La dérogation reste lisible sur la fiche, pas seulement en
              base : un devis parti malgré une alerte bloquante doit porter
              la raison à côté de lui, pas dans un journal qu'on n'ouvre
              jamais. */}
          {row.override_reason && (
            <p className="text-kov-steel text-sm mt-2">
              Dérogation : {row.override_reason as string}
              {row.override_at && (
                <> · {new Date(row.override_at as string).toLocaleDateString("fr-FR")}</>
              )}
            </p>
          )}
        </div>

        <ConfigurationActions
          configurationId={id}
          title={row.title as string}
          status={row.status as string}
          hasQuote={Boolean(row.quote_id)}
        />
      </div>

      {quote && (
        <GlassCard className="p-5">
          <p className="text-kov-bone text-sm">
            Devis {quote.reference as string} généré à partir de ce chiffrage.
          </p>
          <Link href="/admin/quotes" className="text-kov-red text-xs hover:underline mt-1 inline-block">
            Ouvrir les devis →
          </Link>
        </GlassCard>
      )}

      {drifted && snapshot && (
        <GlassCard className="p-5">
          <p className="text-kov-bone text-sm">Les paramètres ont changé depuis ce chiffrage.</p>
          <p className="text-kov-steel text-xs mt-1 tabular-nums">
            Chiffré {formatEuros(snapshot.priceExclVatCents)} HT ; recalculé aujourd&apos;hui, le même contenu
            donnerait {formatEuros(current.priceExclVatCents)}. C&apos;est l&apos;instantané qui est affiché
            ci-dessous, parce que c&apos;est le prix qui a été annoncé.
          </p>
        </GlassCard>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8 lg:items-start">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">
              Le devis, tel qu&apos;il sortira
            </p>
            <ul className="space-y-2">
              {draft.lineItems.map((item, index) => (
                <li key={index} className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
                  <span className="text-kov-concrete flex-1 min-w-0">{item.description}</span>
                  <span className="text-kov-steel text-xs tabular-nums">
                    {item.quantity > 1 && <>{item.quantity} × </>}
                    {formatEuros(item.unitPriceCents)}
                  </span>
                  <span className="text-kov-bone tabular-nums w-24 text-right">
                    {formatEuros(item.quantity * item.unitPriceCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t space-y-1" style={{ borderColor: "var(--kov-border)" }}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-kov-steel">Sous-total</span>
                <span className="text-kov-bone tabular-nums">{formatEuros(draft.subtotalCents)}</span>
              </div>
              {draft.discountCents > 0 && (
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-kov-steel">Remise</span>
                  <span className="text-kov-bone tabular-nums">−{formatEuros(draft.discountCents)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-kov-bone">Total HT</span>
                <span className="text-kov-bone tabular-nums">{formatEuros(draft.totalCents)}</span>
              </div>
            </div>

            {draft.optionLines.length > 0 && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--kov-border)" }}>
                <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
                  Proposé en option, non inclus dans le total
                </p>
                <ul className="space-y-1.5">
                  {draft.optionLines.map((item, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-kov-concrete flex-1 min-w-0">{item.description}</span>
                      <span className="text-kov-steel tabular-nums">
                        {item.quantity > 1 && <>{item.quantity} × </>}
                        {formatEuros(item.unitPriceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {draft.assumptions.length > 0 && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--kov-border)" }}>
                <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">Hypothèses</p>
                <ul className="space-y-1">
                  {draft.assumptions.map((assumption, index) => (
                    <li key={index} className="text-kov-concrete text-xs">
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Le détail de production</p>
            <ul className="space-y-1.5">
              {shown.lines.map((line) => (
                <li key={line.moduleKey} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="text-kov-steel text-[11px] uppercase tracking-widest w-20 shrink-0">
                    {line.roundCode}
                  </span>
                  <span className="text-kov-concrete flex-1 min-w-0">
                    {line.label}
                    {line.quantity > 1 && <span className="text-kov-steel"> × {line.quantity}</span>}
                  </span>
                  <span className="text-kov-steel text-xs tabular-nums">
                    {line.roles
                      .map((role) => `${role.roleCode}${role.subcontracted ? " (st)" : ""} ${role.days}j`)
                      .join(" · ")}
                  </span>
                  <span className="text-kov-bone tabular-nums w-24 text-right">{formatEuros(line.sellCents)}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <aside className="mt-6 lg:mt-0 lg:sticky lg:top-6">
          <GlassCard className="p-5">
            <PricingSummary result={shown} alerts={alerts} settings={catalog.settings} />
          </GlassCard>
        </aside>
      </div>
    </main>
  );
}
