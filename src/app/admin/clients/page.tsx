import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Clients — Admin KOV",
};

export default async function AdminClientsPage() {
  await requireAdmin();

  const { data: clients } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, company, account_manager_id, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const rows = clients ?? [];

  const managerIds = Array.from(new Set(rows.map((c) => c.account_manager_id).filter((id): id is string => !!id)));
  const { data: managers } = managerIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", managerIds)
    : { data: [] };
  const managerNameById = new Map((managers ?? []).map((m) => [m.id, m.full_name]));

  const { data: projectCounts } = rows.length
    ? await supabaseAdmin
        .from("projects")
        .select("client_id")
        .in(
          "client_id",
          rows.map((c) => c.id)
        )
    : { data: [] };
  const countByClient = new Map<string, number>();
  for (const p of projectCounts ?? []) {
    countByClient.set(p.client_id, (countByClient.get(p.client_id) ?? 0) + 1);
  }

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Clients</h1>

      {rows.length === 0 ? (
        <p className="text-kov-steel">Aucun compte client pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr
                className="text-xs uppercase tracking-widest text-kov-steel border-b"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Chef de projet</th>
                <th className="py-3 pr-4">Projets</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => (
                <tr key={client.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-4 pr-4 text-kov-bone">{client.full_name || client.company || "—"}</td>
                  <td className="py-4 pr-4 text-kov-steel">{client.email}</td>
                  <td className="py-4 pr-4 text-kov-steel">
                    {client.account_manager_id ? managerNameById.get(client.account_manager_id) || "—" : "—"}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">{countByClient.get(client.id) ?? 0}</td>
                  <td className="py-4 pr-4">
                    <Link href={`/admin/clients/${client.id}`} className="text-kov-red hover:underline">
                      Gérer →
                    </Link>
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
