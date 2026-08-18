import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { LeadStatusSelect } from "./LeadStatusSelect";

export const metadata: Metadata = {
  title: "Admin — KOV",
};

export default async function AdminPage() {
  await requireAdmin();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, created_at, name, email, phone, message, status")
    .order("created_at", { ascending: false });

  const rows = leads ?? [];

  return (
    <main className="min-h-screen px-6 py-32 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Demandes de contact</h1>
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Se déconnecter
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="text-kov-steel">Aucune demande pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Message</th>
                <th className="py-3 pr-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-4 pr-4 text-kov-bone">{lead.name}</td>
                  <td className="py-4 pr-4 text-kov-bone">
                    <a href={`mailto:${lead.email}`} className="hover:text-kov-red transition-colors">
                      {lead.email}
                    </a>
                    {lead.phone && <div className="text-kov-steel text-xs mt-1">{lead.phone}</div>}
                  </td>
                  <td className="py-4 pr-4 text-kov-bone max-w-sm">{lead.message}</td>
                  <td className="py-4 pr-4">
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
