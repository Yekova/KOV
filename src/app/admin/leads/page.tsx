import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeadStatusSelect } from "./LeadStatusSelect";

export const metadata: Metadata = {
  title: "Leads — Admin KOV",
};

export default async function AdminLeadsPage() {
  await requireAdmin();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, created_at, name, email, phone, company, project_type, message, status")
    .order("created_at", { ascending: false });

  const rows = leads ?? [];

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Leads</h1>

      {rows.length === 0 ? (
        <p className="text-kov-steel">Aucune demande pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Entreprise</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Type de projet</th>
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
                  <td className="py-4 pr-4 text-kov-steel">{lead.company || "—"}</td>
                  <td className="py-4 pr-4 text-kov-bone">
                    <a href={`mailto:${lead.email}`} className="hover:text-kov-red transition-colors">
                      {lead.email}
                    </a>
                    {lead.phone && <div className="text-kov-steel text-xs mt-1">{lead.phone}</div>}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">{lead.project_type || "—"}</td>
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
