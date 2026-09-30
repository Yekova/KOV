import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { Donut, type DonutSegment } from "@/components/admin/Donut";
import { ActivityFeed, type AdminActivityItem } from "@/components/admin/dashboard/ActivityFeed";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { ClientsWorkspace } from "@/components/admin/clients/ClientsWorkspace";
import { CreateSpaceButton } from "@/components/admin/clients/CreateSpaceButton";
import { getClientSummaries, clientDisplayName } from "@/lib/admin/clients";
import { PROJECT_STATUS_LABELS, isProjectStatus } from "@/lib/portal/status";

export const metadata: Metadata = { title: "Clients — Admin KOV" };

// Palette de signal, pas de décoration : le rouge KOV ne sert qu'à ce qui
// avance, l'ambre à ce qui attend, le gris au reste. Convention déjà posée
// sur cet écran avant sa refonte, et conservée telle quelle.
const STATUS_COLORS: Record<string, string> = {
  in_progress: "var(--kov-red)",
  in_review: "var(--kov-concrete)",
  on_hold: "var(--kov-status-orange)",
  done: "var(--kov-steel)",
};

function formatDeadline(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default async function AdminClientsPage() {
  await requireAdmin();

  const clients = await getClientSummaries();

  const { data: recentActivity } = await supabaseAdmin
    .from("activity_log")
    .select("id, type, title, admin_title, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const active = clients.filter((client) => !client.archivedAt);

  // La répartition porte sur les CLIENTS, pas sur les projets : c'est
  // l'écran des clients, et un client à trois projets ne doit pas peser
  // trois fois dans un anneau qui prétend le compter une fois.
  const statusCounts: Record<string, number> = {};
  let withoutProject = 0;
  for (const client of active) {
    if (!client.status) withoutProject += 1;
    else statusCounts[client.status] = (statusCounts[client.status] ?? 0) + 1;
  }

  const segments: DonutSegment[] = [
    ...Object.entries(statusCounts).map(([status, value]) => ({
      key: status,
      label: isProjectStatus(status) ? PROJECT_STATUS_LABELS[status] : status,
      value,
      color: STATUS_COLORS[status] ?? "var(--kov-steel)",
    })),
    ...(withoutProject > 0
      ? [{ key: "none", label: "Sans projet", value: withoutProject, color: "var(--kov-muted)" }]
      : []),
  ];

  // Les prochaines échéances se lisent sur les projets déjà chargés : aucune
  // requête de plus, et la liste ne peut pas contredire les cartes puisque
  // c'est la même donnée.
  const followUps = active
    .filter((client) => client.leadProject?.nextDeadlineDate)
    .sort((a, b) =>
      (a.leadProject!.nextDeadlineDate as string).localeCompare(b.leadProject!.nextDeadlineDate as string)
    )
    .slice(0, 6);

  const sansSociete = active.filter((client) => !client.company?.trim()).length;

  // Les responsables proposés par l'assistant : les admins en activité,
  // pas ceux qui ont été archivés.
  const { data: adminRows } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .is("archived_at", null)
    .order("full_name");
  const adminOptions = (adminRows ?? []).map((row) => ({
    id: row.id as string,
    name: (row.full_name as string | null) || (row.email as string),
  }));

  return (
    <main className="px-6 py-10 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Clients</h1>
          <p className="text-kov-steel text-sm mt-2 max-w-xl">
            Où en est chacun, et ce qui tombe ensuite.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/leads"
            className="px-5 py-2.5 border text-xs uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            Convertir un lead
          </Link>
          {/* Les deux chemins côte à côte : un client vient d'un lead, ou
              de nulle part. Ils passent tous deux par provisionClient. */}
          <CreateSpaceButton admins={adminOptions} />
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[1fr_340px] xl:gap-6 xl:items-start">
        <ClientsWorkspace clients={clients} />

        <aside className="mt-8 xl:mt-0 space-y-6 xl:sticky xl:top-6">
          {segments.length > 0 && (
            <Donut title="Répartition des clients" segments={segments} centerLabel="clients" />
          )}

          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Prochaines échéances</p>
            {followUps.length === 0 ? (
              <p className="text-kov-steel text-sm">
                Aucune échéance renseignée. Elles se saisissent sur la fiche d&apos;un projet et remontent ici
                automatiquement.
              </p>
            ) : (
              <ul className="space-y-3">
                {followUps.map((client) => (
                  <li key={client.id}>
                    <Link
                      href={`/admin/projects/${client.leadProject!.id}`}
                      className="flex items-start gap-3 group"
                    >
                      <ClientAvatar name={clientDisplayName(client)} avatarUrl={client.avatarUrl} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-kov-bone text-sm truncate group-hover:text-kov-red transition-colors">
                          {clientDisplayName(client)}
                        </span>
                        <span className="block text-kov-steel text-[11px] truncate">
                          {client.leadProject!.nextDeadlineLabel?.trim() || client.leadProject!.name}
                        </span>
                        <span className="block text-kov-concrete text-[11px]">
                          {formatDeadline(client.leadProject!.nextDeadlineDate as string)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <ActivityFeed items={(recentActivity ?? []) as AdminActivityItem[]} />

          {/* Ce qui manque en base, dit une fois plutôt que répété sur chaque
              carte. C'est la ligne qui fait aller remplir les fiches. */}
          {sansSociete > 0 && (
            <GlassCard className="p-5">
              <p className="text-kov-bone text-sm">
                {sansSociete} client{sansSociete > 1 ? "s" : ""} sans raison sociale
              </p>
              <p className="text-kov-steel text-xs mt-1">
                Elle apparaît sur les devis et les factures. Sans elle, le document part au nom de la personne.
              </p>
            </GlassCard>
          )}
        </aside>
      </div>
    </main>
  );
}
