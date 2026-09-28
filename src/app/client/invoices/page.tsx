import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getClientBilling } from "@/lib/portal/billing";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { ActionRequiredCard, type ActionItem } from "@/components/client/dashboard/ActionRequiredCard";
import { BillingKpis } from "@/components/client/billing/BillingKpis";
import { BillingWorkspace } from "@/components/client/billing/BillingWorkspace";
import { PaymentHistory } from "@/components/client/billing/PaymentHistory";
import { BillingResources } from "@/components/client/billing/BillingResources";

export const metadata: Metadata = {
  title: "Facturation & devis — KOV",
};

// Un seul écran pour les devis et les factures.
//
// Ils vivaient sur deux pages, avec deux entrées de menu, alors qu'un devis
// DEVIENT une facture (quotes.invoice_id) : suivre un montant obligeait à
// changer d'onglet au milieu de son propre parcours. /client/quotes
// redirige maintenant ici, et l'entrée « Devis » a quitté le menu.
export default async function ClientBillingPage() {
  const user = await requireUser();

  const [billing, business] = await Promise.all([getClientBilling(user.id), getBusinessInfo()]);

  const actionItems: ActionItem[] = billing.documents
    .filter((document) => document.actionable)
    .map((document) => ({
      id: `${document.kind}-${document.id}`,
      label:
        document.kind === "quote"
          ? `Devis ${document.reference} à signer`
          : document.statusLabel === "En retard"
            ? `Facture ${document.reference} en retard`
            : `Facture ${document.reference} à régler`,
      detail:
        document.dueDate && document.dueInDays !== null
          ? document.dueInDays < 0
            ? `Échéance dépassée depuis ${Math.abs(document.dueInDays)} jour${Math.abs(document.dueInDays) > 1 ? "s" : ""}`
            : `Avant le ${new Date(document.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
          : document.kind === "quote"
            ? "En attente de votre retour"
            : "Sans échéance",
      href: "#documents",
      urgent: document.statusLabel === "En retard",
    }));

  const payments = billing.documents.filter((document) => document.paidAt);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 px-6 py-8 md:px-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-kov-red">Facturation</p>
        <h1
          className="mt-3 font-display uppercase text-kov-bone"
          style={{ fontSize: "clamp(26px, 3.4vw, 42px)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
        >
          Devis &amp; factures<span className="text-kov-red">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-kov-concrete">
          Tout ce que le studio vous adresse, au même endroit — de la proposition signée à la facture réglée.
        </p>
      </div>

      <BillingKpis
        quotesToSign={billing.quotesToSign}
        invoicesToPay={billing.invoicesToPay}
        outstandingCents={billing.outstandingCents}
        paidThisMonthCents={billing.paidThisMonthCents}
        paidLastMonthCents={billing.paidLastMonthCents}
        currency={billing.currency}
      />

      <ActionRequiredCard items={actionItems} />

      <div id="documents" className="scroll-mt-6">
        <BillingWorkspace documents={billing.documents} />
      </div>

      <PaymentHistory payments={payments} />

      <BillingResources business={business} />
    </main>
  );
}
