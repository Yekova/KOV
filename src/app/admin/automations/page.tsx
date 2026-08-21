import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = { title: "Automatisations — Admin KOV" };

const AUTOMATIONS = [
  {
    title: "Notification d'équipe sur nouveau message client",
    description: "Chaque admin actif reçoit un email dès qu'un client crée une demande ou répond dans un fil existant.",
    trigger: "Immédiat, à l'événement",
    needsCron: false,
  },
  {
    title: "Rappel de devis avant expiration",
    description: "Le destinataire d'un devis envoyé reçoit un rappel avec le PDF, environ 3 jours avant sa date de validité.",
    trigger: "Vérifié une fois par jour",
    needsCron: true,
  },
  {
    title: "Rappel de facture en retard",
    description: "Le client reçoit un rappel avec le PDF le jour où une facture envoyée dépasse sa date d'échéance.",
    trigger: "Vérifié une fois par jour",
    needsCron: true,
  },
];

export default async function AdminAutomationsPage() {
  await requireAdmin();
  const cronConfigured = !!process.env.CRON_SECRET;

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Automatisations</h1>

      {!cronConfigured && (
        <GlassCard className="p-5" variant="solid">
          <p className="text-kov-red text-sm">
            Variable <code>CRON_SECRET</code> absente — les deux rappels planifiés ci-dessous sont déployés mais inactifs tant
            qu&apos;elle n&apos;est pas ajoutée dans les paramètres du projet Vercel.
          </p>
        </GlassCard>
      )}

      <div className="space-y-3">
        {AUTOMATIONS.map((automation) => (
          <GlassCard key={automation.title} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-kov-bone text-sm mb-1">{automation.title}</p>
                <p className="text-kov-steel text-sm leading-relaxed">{automation.description}</p>
              </div>
              <span
                className="text-[10px] uppercase tracking-widest px-2 py-1 shrink-0"
                style={{
                  color: automation.needsCron && !cronConfigured ? "var(--kov-steel)" : "var(--kov-red)",
                  background: automation.needsCron && !cronConfigured ? "var(--kov-graphite)" : "rgba(220,38,38,0.1)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {automation.needsCron && !cronConfigured ? "Inactif" : "Actif"}
              </span>
            </div>
            <p className="text-kov-steel text-xs uppercase tracking-widest mt-3">{automation.trigger}</p>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
