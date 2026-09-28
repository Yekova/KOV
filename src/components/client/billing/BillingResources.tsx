import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import type { BusinessInfo } from "@/lib/billing/businessInfo";

// Les informations de facturation, et elles sont vraies.
//
// Le RIB, le SIRET et la mention de TVA viennent de business_settings —
// les mêmes valeurs que celles imprimées au bas de chaque facture, donc
// il n'y a pas deux sources qui pourraient diverger.
//
// La mention de TVA est affichée telle quelle, et c'est important : KOV
// est en franchise (art. 293 B du CGI). C'est aussi la raison pour
// laquelle aucun écran de cet espace n'affiche de ligne de TVA.
export function BillingResources({ business }: { business: BusinessInfo }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <GlassCard className="p-6">
        <h2 className="mb-4 text-xs uppercase tracking-widest text-kov-concrete">Coordonnées de facturation</h2>

        <dl className="space-y-2.5 text-sm">
          <div>
            <dt className="text-xs text-kov-concrete">Bénéficiaire</dt>
            <dd className="text-kov-bone">{business.legalName}</dd>
          </div>
          {business.iban && (
            <div>
              <dt className="text-xs text-kov-concrete">IBAN</dt>
              <dd className="font-mono text-[13px] text-kov-bone">{business.iban}</dd>
            </div>
          )}
          {business.bic && (
            <div>
              <dt className="text-xs text-kov-concrete">BIC</dt>
              <dd className="font-mono text-[13px] text-kov-bone">{business.bic}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-kov-concrete">SIRET</dt>
            <dd className="text-kov-bone">{business.siret}</dd>
          </div>
          <div>
            <dt className="text-xs text-kov-concrete">Délai de règlement</dt>
            <dd className="text-kov-bone">{business.paymentTermsDays} jours</dd>
          </div>
        </dl>

        <p className="mt-4 border-t pt-4 text-xs text-kov-concrete" style={{ borderColor: "var(--kov-border)" }}>
          {business.vatMention}
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-xs uppercase tracking-widest text-kov-concrete">Questions</h2>

        <ul className="space-y-1">
          {[
            { label: "Une question sur un document", detail: "Écrire au studio", href: "/client/requests" },
            { label: "Conditions générales", detail: "Consulter les CGV", href: "/legal/cgv" },
            { label: "Questions fréquentes", detail: "Les réponses courantes", href: "/faq" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-kov-bone transition-colors group-hover:text-kov-red">
                    {item.label}
                  </span>
                  <span className="block text-xs text-kov-concrete">{item.detail}</span>
                </span>
                <span aria-hidden="true" className="shrink-0 text-kov-concrete transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
