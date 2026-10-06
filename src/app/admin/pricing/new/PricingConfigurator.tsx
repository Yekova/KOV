"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { PricingSummary } from "@/components/admin/pricing/PricingSummary";
import { priceConfiguration } from "@/lib/pricing/engine";
import { collectAlerts, hasBlockingAlert } from "@/lib/pricing/alerts";
import { formatBp, formatDays, formatEuros } from "@/lib/pricing/money";
import { ROUNDS, getRound } from "@/lib/pricing/rounds";
import { isScheduleComplete, scheduleTotalBp } from "@/lib/pricing/schedule";
import { saveConfiguration } from "./actions";
import type {
  ClientVatRegime,
  ComplexityKey,
  PricingCatalog,
  PricingConditions,
  PricingModule,
  PricingSelection,
  RoundCode,
  ScheduleTemplateEntry,
  UrgencyKey,
} from "@/lib/pricing/types";

// Le configurateur.
//
// ── POURQUOI LE CALCUL EST ICI ET PAS SUR LE SERVEUR ─────────────────────
//
// Le moteur est pur : ni Supabase, ni React, ni accès réseau. Il traverse
// donc le pont sans rien emporter, et tourne dans le navigateur. Cocher un
// module recalcule le prix, les jours, la marge et les douze alertes
// immédiatement, sans aller-retour. C'est précisément ce que la contrainte
// de pureté achetait : un chiffrage qui réagit comme un tableur.
//
// Le catalogue complet pèse quelques kilo-octets ; l'envoyer une fois coûte
// moins qu'une seule requête par case cochée.
//
// L'enregistrement, lui, REJOUE le calcul côté serveur (voir actions.ts).
// Ce qui s'affiche ici sert à décider ; ce qui se stocke doit venir d'une
// source dont on répond.

export interface ConfiguratorPerson {
  id: string;
  name: string;
  company: string | null;
}

const COMPLEXITY_LABELS: Record<ComplexityKey, string> = {
  simple: "Simple",
  standard: "Standard",
  high: "Élevée",
  critical: "Critique",
};

const URGENCY_LABELS: Record<UrgencyKey, string> = {
  normal: "Délai normal",
  reduced25: "Délai réduit de 25 %",
  reduced40: "Délai réduit de 40 %",
};

const VAT_LABELS: Record<ClientVatRegime, string> = {
  liable: "Assujetti, récupère la TVA",
  partial: "Récupération partielle",
  exempt: "Non assujetti",
};

const SEGMENTS = [
  "Cabinet financier ou CGP",
  "Cabinet de conseil",
  "Profession libérale",
  "PME B2B",
  "Startup",
  "Autre",
];

interface ModuleState {
  quantity: number;
  subcontractedRoles: string[];
}

function Section({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  // <details> natif : pliage au clavier, état exposé aux technologies
  // d'assistance, et rien à maintenir. Une réimplémentation en useState
  // aurait demandé aria-expanded, la gestion d'Entrée et d'Espace, et
  // aurait fini moins correcte.
  return (
    <details open={defaultOpen} className="group">
      <summary className="cursor-pointer list-none flex items-baseline justify-between gap-3 py-3">
        <span>
          <span className="text-kov-bone text-sm uppercase tracking-widest">{title}</span>
          {hint && <span className="block text-kov-steel text-xs mt-0.5 normal-case tracking-normal">{hint}</span>}
        </span>
        <span className="text-kov-steel text-xs shrink-0 group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="pb-6 pt-1">{children}</div>
    </details>
  );
}

export function PricingConfigurator({
  catalog,
  settingsVersionId,
  clients,
  leads,
  oldestBenchmarkConsultedAt,
  todayIso,
}: {
  catalog: PricingCatalog;
  settingsVersionId: string;
  clients: ConfiguratorPerson[];
  leads: ConfiguratorPerson[];
  oldestBenchmarkConsultedAt: string | null;
  todayIso: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState<string>("");
  const [segment, setSegment] = useState<string>("");
  const [clientVatRegime, setClientVatRegime] = useState<ClientVatRegime>("liable");
  const [complexity, setComplexity] = useState<ComplexityKey>("standard");
  const [urgency, setUrgency] = useState<UrgencyKey>("normal");

  const [offerKey, setOfferKey] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, ModuleState>>({});
  const [options, setOptions] = useState<Record<string, number>>({});
  const [subscriptionKey, setSubscriptionKey] = useState<string | null>(null);

  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [validityDays, setValidityDays] = useState(String(catalog.settings.quoteValidityDays));
  const [leadTimeLabel, setLeadTimeLabel] = useState("");
  const [displayMode, setDisplayMode] = useState<"round" | "module">("round");
  const [schedule, setSchedule] = useState<ScheduleTemplateEntry[] | null>(null);

  const [saving, setSaving] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const selection: PricingSelection = useMemo(
    () => ({
      offerKey,
      modules: Object.entries(modules).map(([moduleKey, state]) => ({
        moduleKey,
        quantity: state.quantity,
        subcontractedRoles: state.subcontractedRoles,
      })),
      options: Object.entries(options).map(([moduleKey, quantity]) => ({
        moduleKey,
        quantity,
        subcontractedRoles: [],
      })),
      subscriptionKey,
      complexity,
      urgency,
      clientVatRegime,
    }),
    [offerKey, modules, options, subscriptionKey, complexity, urgency, clientVatRegime]
  );

  const conditions: PricingConditions = useMemo(() => {
    const parsed = Number(discountPercent.replace(",", "."));
    return {
      discountBp: Number.isFinite(parsed) ? Math.round(parsed * 100) : 0,
      discountReason: discountReason.trim() || null,
      validityDays: Number(validityDays) || catalog.settings.quoteValidityDays,
      leadTimeLabel: leadTimeLabel.trim() || null,
      displayMode,
      schedule,
    };
  }, [discountPercent, discountReason, validityDays, leadTimeLabel, displayMode, schedule, catalog.settings.quoteValidityDays]);

  const result = useMemo(
    () => priceConfiguration(catalog, selection, conditions),
    [catalog, selection, conditions]
  );

  const alerts = useMemo(
    () =>
      collectAlerts(result, catalog, selection, conditions, {
        oldestBenchmarkConsultedAt,
        today: new Date(`${todayIso}T12:00:00`),
      }),
    [result, catalog, selection, conditions, oldestBenchmarkConsultedAt, todayIso]
  );

  const blocking = hasBlockingAlert(alerts);
  const activeSchedule = schedule ?? catalog.offers.find((offer) => offer.key === offerKey)?.paymentSchedule ?? [];
  const scheduleValid = activeSchedule.length === 0 || isScheduleComplete(activeSchedule);

  function chooseOffer(key: string) {
    setOfferKey(key);
    // Choisir une offre REMPLACE la sélection par sa composition par défaut.
    // Fusionner aurait laissé traîner les modules de l'offre précédente,
    // qu'on ne remarquerait qu'au moment de relire le devis.
    const defaults = catalog.defaultModulesByOffer[key] ?? [];
    setModules(
      Object.fromEntries(
        defaults.map((entry) => [
          entry.moduleKey,
          {
            quantity: entry.quantity,
            subcontractedRoles: defaultSubcontractedFor(entry.moduleKey),
          },
        ])
      )
    );
    setSchedule(null);
    const offer = catalog.offers.find((o) => o.key === key);
    if (offer?.leadTimeLabel) setLeadTimeLabel(offer.leadTimeLabel);
    if (!title.trim() && offer) setTitle(offer.label);
  }

  function defaultSubcontractedFor(moduleKey: string): string[] {
    const definition = catalog.modules.find((module) => module.key === moduleKey);
    if (!definition) return [];
    return Object.keys(definition.roleDays).filter((roleCode) => {
      const role = catalog.roles.find((r) => r.code === roleCode);
      return Boolean(role?.defaultSubcontracted && !role.internalOnly);
    });
  }

  function toggleModule(moduleKey: string) {
    setModules((current) => {
      if (current[moduleKey]) {
        const next = { ...current };
        delete next[moduleKey];
        return next;
      }
      return {
        ...current,
        [moduleKey]: { quantity: 1, subcontractedRoles: defaultSubcontractedFor(moduleKey) },
      };
    });
  }

  function setQuantity(moduleKey: string, quantity: number) {
    setModules((current) =>
      current[moduleKey] ? { ...current, [moduleKey]: { ...current[moduleKey], quantity } } : current
    );
  }

  function toggleSubcontracting(moduleKey: string, roleCode: string) {
    setModules((current) => {
      const state = current[moduleKey];
      if (!state) return current;
      const has = state.subcontractedRoles.includes(roleCode);
      return {
        ...current,
        [moduleKey]: {
          ...state,
          subcontractedRoles: has
            ? state.subcontractedRoles.filter((code) => code !== roleCode)
            : [...state.subcontractedRoles, roleCode],
        },
      };
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Donnez un nom à ce chiffrage.");
      return;
    }
    setSaving(true);
    const [kind, id] = recipient ? recipient.split(":") : [null, null];
    const response = await saveConfiguration({
      settingsVersionId,
      title,
      clientId: kind === "client" ? id : null,
      leadId: kind === "lead" ? id : null,
      segment: segment || null,
      clientVatRegime,
      selection,
      conditions,
    });
    setSaving(false);

    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("Chiffrage enregistré.");
    router.push(`/admin/pricing/${response.configurationId}`);
  }

  const modulesByRound = useMemo(() => {
    const grouped = new Map<RoundCode, PricingModule[]>();
    for (const definition of catalog.modules) {
      grouped.set(definition.roundCode, [...(grouped.get(definition.roundCode) ?? []), definition]);
    }
    return grouped;
  }, [catalog.modules]);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8 lg:items-start">
      <div className="space-y-2 pb-28 lg:pb-0">
        <GlassCard className="px-6 divide-y divide-[var(--kov-border)]">
          {/* ── 1. Client et contexte ─────────────────────────────────── */}
          <Section title="Client et contexte">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-title">
                  Nom du chiffrage <span className="text-kov-red">*</span>
                </label>
                <input
                  id="pricing-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Site vitrine — Cabinet Martin"
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-recipient">
                  Destinataire
                </label>
                <select
                  id="pricing-recipient"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                >
                  <option value="">Aucun pour l&apos;instant</option>
                  {clients.length > 0 && (
                    <optgroup label="Clients">
                      {clients.map((client) => (
                        <option key={client.id} value={`client:${client.id}`}>
                          {client.company ? `${client.company} — ${client.name}` : client.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {leads.length > 0 && (
                    <optgroup label="Leads">
                      {leads.map((lead) => (
                        <option key={lead.id} value={`lead:${lead.id}`}>
                          {lead.company ? `${lead.company} — ${lead.name}` : lead.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-segment">
                  Segment
                </label>
                <select
                  id="pricing-segment"
                  value={segment}
                  onChange={(event) => setSegment(event.target.value)}
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                >
                  <option value="">Non renseigné</option>
                  {SEGMENTS.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-vat">
                  Régime de TVA du client
                </label>
                <select
                  id="pricing-vat"
                  value={clientVatRegime}
                  onChange={(event) => setClientVatRegime(event.target.value as ClientVatRegime)}
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                >
                  {Object.entries(VAT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-complexity">
                  Complexité
                </label>
                <select
                  id="pricing-complexity"
                  value={complexity}
                  onChange={(event) => setComplexity(event.target.value as ComplexityKey)}
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                >
                  {Object.entries(COMPLEXITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label} ({formatBp(catalog.settings.complexityBp[value as ComplexityKey])} des jours)
                    </option>
                  ))}
                </select>
                <p className="text-kov-steel text-[11px] mt-1">
                  Agit sur les jours, donc aussi sur le coût. Pas sur le prix seul.
                </p>
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-urgency">
                  Urgence
                </label>
                <select
                  id="pricing-urgency"
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value as UrgencyKey)}
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                >
                  {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                      {catalog.settings.urgencyBp[value as UrgencyKey] > 0 &&
                        ` · +${formatBp(catalog.settings.urgencyBp[value as UrgencyKey])}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          {/* ── 2. Offre de base ──────────────────────────────────────── */}
          <Section title="Offre de base" hint="Choisir une offre pré-coche sa composition, et remplace la sélection en cours.">
            <div className="grid gap-2 sm:grid-cols-2">
              {catalog.offers.map((offer) => {
                const isActive = offer.key === offerKey;
                const count = (catalog.defaultModulesByOffer[offer.key] ?? []).length;
                return (
                  <button
                    key={offer.key}
                    type="button"
                    onClick={() => chooseOffer(offer.key)}
                    className="text-left border px-4 py-3 transition-colors hover:border-kov-red"
                    style={{
                      borderColor: isActive ? "var(--kov-red)" : "var(--kov-border)",
                      borderRadius: "var(--radius-sm)",
                      background: isActive ? "var(--kov-carbon)" : undefined,
                    }}
                    aria-pressed={isActive}
                  >
                    <p className="text-kov-bone text-sm">{offer.label}</p>
                    <p className="text-kov-steel text-[11px] mt-0.5 tabular-nums">
                      {count === 0 ? "aucun module pré-coché" : `${count} modules`}
                      {offer.referencePriceCents !== null && <> · référence {formatEuros(offer.referencePriceCents)}</>}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── 3. Modules ────────────────────────────────────────────── */}
          <Section title="Modules" hint="Groupés par round de production. Les jours affichés sont ceux du catalogue, avant complexité.">
            <div className="space-y-6">
              {ROUNDS.map((round) => {
                const roundModules = modulesByRound.get(round.code) ?? [];
                if (roundModules.length === 0) return null;

                return (
                  <div key={round.code}>
                    <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
                      {round.label}
                      <span className="text-kov-concrete normal-case tracking-normal"> · {round.phaseName}</span>
                    </p>
                    <ul className="space-y-1.5">
                      {roundModules.map((module) => {
                        const state = modules[module.key];
                        const checked = Boolean(state);
                        return (
                          <li key={module.key}>
                            <div
                              className="border px-3 py-2.5"
                              style={{
                                borderColor: checked ? "var(--kov-red)" : "var(--kov-border)",
                                borderRadius: "var(--radius-sm)",
                              }}
                            >
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleModule(module.key)}
                                  className="mt-1 accent-[var(--kov-red)]"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-kov-bone text-sm">{module.label}</span>
                                  <span className="block text-kov-steel text-[11px] mt-0.5 tabular-nums">
                                    {Object.entries(module.roleDays)
                                      .map(([code, days]) => `${code} ${formatDays(days)}`)
                                      .join(" · ") || "aucun jour de production"}
                                    {module.externalCostsCents > 0 && (
                                      <> · {formatEuros(module.externalCostsCents)} d&apos;externes</>
                                    )}
                                    {module.roundSpanLabel && <> · {module.roundSpanLabel}</>}
                                  </span>
                                </span>
                              </label>

                              {checked && (
                                <div className="mt-2.5 pl-7 flex flex-wrap items-center gap-x-4 gap-y-2">
                                  {module.quantityUnit && (
                                    <label className="flex items-center gap-2">
                                      <span className="text-kov-steel text-[11px]">{module.quantityUnit}</span>
                                      <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={state.quantity}
                                        onChange={(event) =>
                                          setQuantity(module.key, Math.max(1, Number(event.target.value) || 1))
                                        }
                                        className="w-16 bg-transparent border px-2 py-1 text-kov-bone text-xs tabular-nums focus:outline-none focus:border-kov-red"
                                        style={FIELD_STYLE}
                                      />
                                    </label>
                                  )}

                                  {Object.keys(module.roleDays).map((roleCode) => {
                                    const role = catalog.roles.find((r) => r.code === roleCode);
                                    if (!role || role.internalOnly) return null;
                                    const isSub = state.subcontractedRoles.includes(roleCode);
                                    return (
                                      <button
                                        key={roleCode}
                                        type="button"
                                        onClick={() => toggleSubcontracting(module.key, roleCode)}
                                        aria-pressed={isSub}
                                        className="px-2 py-1 border text-[11px] transition-colors"
                                        style={{
                                          borderColor: isSub ? "var(--kov-red)" : "var(--kov-border)",
                                          borderRadius: "var(--radius-sm)",
                                          color: isSub ? "var(--kov-red)" : "var(--kov-steel)",
                                        }}
                                      >
                                        {roleCode} {isSub ? "sous-traité" : "interne"}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── 4. Abonnement ─────────────────────────────────────────── */}
          <Section title="Abonnement" hint="Calculé séparément du projet : ce n'est pas un jalon de production." defaultOpen={false}>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSubscriptionKey(null)}
                aria-pressed={subscriptionKey === null}
                className="text-left border px-4 py-3 transition-colors hover:border-kov-red"
                style={{
                  borderColor: subscriptionKey === null ? "var(--kov-red)" : "var(--kov-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <p className="text-kov-bone text-sm">Aucun</p>
              </button>
              {catalog.subscriptions.map((subscription) => {
                const isActive = subscription.key === subscriptionKey;
                return (
                  <button
                    key={subscription.key}
                    type="button"
                    onClick={() => setSubscriptionKey(subscription.key)}
                    aria-pressed={isActive}
                    className="text-left border px-4 py-3 transition-colors hover:border-kov-red"
                    style={{
                      borderColor: isActive ? "var(--kov-red)" : "var(--kov-border)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <p className="text-kov-bone text-sm">{subscription.label}</p>
                    <p className="text-kov-steel text-[11px] mt-0.5 tabular-nums">
                      {formatEuros(subscription.monthlyPriceCents)} / mois ·{" "}
                      {formatDays(subscription.monthlyDays)} par mois
                      {subscription.minCommitmentMonths > 0 && <> · {subscription.minCommitmentMonths} mois</>}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── 5. Conditions ─────────────────────────────────────────── */}
          <Section title="Conditions" defaultOpen={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-discount">
                  Remise (%)
                </label>
                <input
                  id="pricing-discount"
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                  inputMode="decimal"
                  className={`${FIELD_CLASS} mt-1 tabular-nums`}
                  style={FIELD_STYLE}
                />
                <p className="text-kov-steel text-[11px] mt-1">
                  Maximum {formatBp(catalog.settings.maxDiscountBp)}. Au-delà, la génération est refusée.
                </p>
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-discount-reason">
                  Motif de la remise
                </label>
                <input
                  id="pricing-discount-reason"
                  value={discountReason}
                  onChange={(event) => setDiscountReason(event.target.value)}
                  placeholder="Obligatoire dès qu'une remise est appliquée"
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-validity">
                  Validité du devis (jours)
                </label>
                <input
                  id="pricing-validity"
                  value={validityDays}
                  onChange={(event) => setValidityDays(event.target.value)}
                  inputMode="numeric"
                  className={`${FIELD_CLASS} mt-1 tabular-nums`}
                  style={FIELD_STYLE}
                />
              </div>

              <div>
                <label className={FIELD_LABEL} htmlFor="pricing-leadtime">
                  Délai d&apos;exécution
                </label>
                <input
                  id="pricing-leadtime"
                  value={leadTimeLabel}
                  onChange={(event) => setLeadTimeLabel(event.target.value)}
                  placeholder="8 à 12 semaines"
                  className={`${FIELD_CLASS} mt-1`}
                  style={FIELD_STYLE}
                />
              </div>

              <div className="sm:col-span-2">
                <p className={FIELD_LABEL}>Ce que le client voit sur le devis</p>
                <div className="flex gap-2 mt-1">
                  {(["round", "module"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDisplayMode(mode)}
                      aria-pressed={displayMode === mode}
                      className="px-4 py-2 border text-xs transition-colors"
                      style={{
                        borderColor: displayMode === mode ? "var(--kov-red)" : "var(--kov-border)",
                        borderRadius: "var(--radius-sm)",
                        color: displayMode === mode ? "var(--kov-red)" : "var(--kov-steel)",
                      }}
                    >
                      {mode === "round" ? "Un forfait par round" : "Le détail par module"}
                    </button>
                  ))}
                </div>
              </div>

              {activeSchedule.length > 0 && (
                <div className="sm:col-span-2">
                  <p className={FIELD_LABEL}>Échéancier</p>
                  <ul className="mt-1 space-y-2">
                    {activeSchedule.map((entry, index) => (
                      <li key={`${entry.label}-${index}`} className="flex flex-wrap items-center gap-2">
                        <input
                          value={entry.label}
                          onChange={(event) => {
                            const next = [...activeSchedule];
                            next[index] = { ...entry, label: event.target.value };
                            setSchedule(next);
                          }}
                          className={`${FIELD_CLASS} flex-1 min-w-[12rem]`}
                          style={FIELD_STYLE}
                        />
                        <input
                          value={(entry.percentBp / 100).toString()}
                          onChange={(event) => {
                            const parsed = Number(event.target.value.replace(",", "."));
                            const next = [...activeSchedule];
                            next[index] = {
                              ...entry,
                              percentBp: Number.isFinite(parsed) ? Math.round(parsed * 100) : 0,
                            };
                            setSchedule(next);
                          }}
                          inputMode="decimal"
                          className="w-20 bg-transparent border px-3 py-2 text-kov-bone text-sm tabular-nums focus:outline-none focus:border-kov-red"
                          style={FIELD_STYLE}
                        />
                        <span className="text-kov-steel text-xs">%</span>
                      </li>
                    ))}
                  </ul>
                  <p
                    className="text-[11px] mt-2 tabular-nums"
                    style={{ color: scheduleValid ? "var(--kov-steel)" : "var(--kov-red)" }}
                  >
                    Total {formatBp(scheduleTotalBp(activeSchedule))}
                    {!scheduleValid && " — les échéances doivent faire exactement 100 %."}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* ── 6. Options ────────────────────────────────────────────── */}
          <Section
            title="Options à proposer"
            hint="Chiffrées et imprimées sur le devis, jamais additionnées au total."
            defaultOpen={false}
          >
            <ul className="space-y-1.5">
              {catalog.modules
                .filter((optional) => optional.isOptional && !modules[optional.key])
                .map((optional) => {
                  const checked = options[optional.key] !== undefined;
                  return (
                    <li key={optional.key}>
                      <label
                        className="flex items-start gap-3 border px-3 py-2.5 cursor-pointer"
                        style={{
                          borderColor: checked ? "var(--kov-red)" : "var(--kov-border)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setOptions((current) => {
                              if (current[optional.key] !== undefined) {
                                const next = { ...current };
                                delete next[optional.key];
                                return next;
                              }
                              return { ...current, [optional.key]: 1 };
                            })
                          }
                          className="mt-1 accent-[var(--kov-red)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-kov-bone text-sm">{optional.label}</span>
                          <span className="block text-kov-steel text-[11px] mt-0.5">
                            {getRound(optional.roundCode).label}
                            {optional.quantityUnit && <> · par {optional.quantityUnit}</>}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </Section>
        </GlassCard>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-6 py-3 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {saving ? "Enregistrement…" : "Enregistrer le chiffrage"}
          </button>
          {/* Dire ce qui bloque sans dire comment passer laisse croire que
              le devis est impossible. Il ne l'est pas : il est conditionné
              à une dérogation écrite. C'est une différence de nature, et
              elle doit se lire ici, pas se découvrir après un refus. */}
          {blocking && (
            <p className="text-kov-steel text-xs max-w-md">
              Le brouillon s&apos;enregistre malgré les alertes bloquantes. C&apos;est la génération du devis
              qu&apos;elles conditionnent : elle sera possible, mais demandera une dérogation écrite,
              enregistrée avec votre nom et la date.
            </p>
          )}
        </div>
      </div>

      {/* Le récapitulatif : collé à droite sur grand écran. */}
      <aside className="hidden lg:block lg:sticky lg:top-6">
        <GlassCard className="p-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <PricingSummary result={result} alerts={alerts} settings={catalog.settings} />
        </GlassCard>
      </aside>

      {/* Sur mobile, une barre fixe : le prix suit le doigt, le détail
          s'ouvre à la demande. Coller le panneau entier en bas mangerait
          l'écran sur lequel on coche. */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t px-4 py-3 flex items-center justify-between gap-3 z-40"
        style={{ borderColor: "var(--kov-border)", background: "var(--kov-carbon)" }}
      >
        <div className="min-w-0">
          <p className="text-kov-bone text-lg tabular-nums leading-none">
            {formatEuros(result.vat.emphasiseInclVat ? result.vat.totalInclVatCents : result.priceExclVatCents)}
          </p>
          <p className="text-kov-steel text-[11px] mt-1 tabular-nums">
            {formatDays(result.totalDays)}
            {result.marginBp !== null && <> · marge {formatBp(result.marginBp)}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSummaryOpen(true)}
          className="px-4 py-2 border text-xs uppercase tracking-widest shrink-0"
          style={{
            borderColor: blocking ? "var(--kov-red)" : "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
            color: blocking ? "var(--kov-red)" : "var(--kov-bone)",
          }}
        >
          Détail{alerts.length > 0 && ` · ${alerts.length}`}
        </button>
      </div>

      <Modal open={summaryOpen} onClose={() => setSummaryOpen(false)} title="Récapitulatif" size="md">
        <PricingSummary result={result} alerts={alerts} settings={catalog.settings} />
      </Modal>
    </div>
  );
}
