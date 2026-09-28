import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { formatMoneyPrecise } from "@/lib/pricing/money";
import { downloadBillingDocument } from "@/app/client/invoices/actions";
import type { BillingDocument } from "@/lib/portal/billing";

// L'historique des paiements.
//
// La maquette portait une colonne « mode de paiement » — virement, carte.
// Elle n'existe nulle part : ni invoices, ni aucune autre table ne stocke
// comment une facture a été réglée. La colonne est donc absente plutôt
// qu'inventée. Le jour où le moyen de paiement sera enregistré, elle se
// rajoutera ici en trois lignes.
export function PaymentHistory({ payments }: { payments: BillingDocument[] }) {
  if (payments.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <h2 className="mb-5 text-xs uppercase tracking-widest text-kov-concrete">Historique des paiements</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--kov-border)" }}>
              <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                Réglée le
              </th>
              <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                Référence
              </th>
              <th className="py-3 pr-4 text-left text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                Projet
              </th>
              <th className="py-3 pr-4 text-right text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                Montant
              </th>
              <th className="py-3 text-right text-[11px] font-normal uppercase tracking-widest text-kov-concrete">
                PDF
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b last:border-b-0" style={{ borderColor: "var(--kov-border)" }}>
                <td className="py-3 pr-4 whitespace-nowrap text-xs text-kov-concrete">
                  {payment.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-kov-bone">{payment.reference}</td>
                <td className="max-w-[16rem] truncate py-3 pr-4 text-xs text-kov-concrete">
                  {payment.projectName ?? "—"}
                </td>
                <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums text-kov-bone">
                  {formatMoneyPrecise(payment.amountCents, payment.currency)}
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  {payment.hasPdf ? (
                    <form action={downloadBillingDocument}>
                      <input type="hidden" name="kind" value={payment.kind} />
                      <input type="hidden" name="id" value={payment.id} />
                      <Button type="submit" variant="ghost" aria-label={`Télécharger ${payment.reference}`}>
                        ↓
                      </Button>
                    </form>
                  ) : (
                    <span className="text-[11px] text-kov-concrete">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
