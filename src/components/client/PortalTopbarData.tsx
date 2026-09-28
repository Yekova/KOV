import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PortalTopbar } from "./PortalTopbar";
import type { ClientNotificationItem } from "./NotificationBell";
import type { PortalSearchItem } from "./PortalSearch";

function notificationHref(type: string, projectId: string | null): string {
  switch (type) {
    case "message":
      return "/client/requests";
    case "invoice":
      return "/client/invoices";
    case "quote":
      return "/client/quotes";
    case "document":
      return projectId ? `/client/projects/${projectId}` : "/client/documents";
    default:
      return projectId ? `/client/projects/${projectId}` : "/client";
  }
}

/** Borné, mais assez large pour couvrir l'historique réel d'un client. */
const SEARCH_LIMIT = 200;

// Isolated in its own Suspense boundary (see client/layout.tsx) — same
// rationale as the admin shell's AdminTopbarData: this is the heaviest part
// of the portal shell, so it must never block route transitions.
export async function PortalTopbarData({ userId }: { userId: string }) {
  const [{ data: profile }, { count: unreadCount }, { data: recentActivity }, { data: projects }, { data: documents }, { data: invoices }, { data: quotes }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, avatar_path").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("activity_log").select("id", { count: "exact", head: true }).eq("client_id", userId).is("read_at", null),
      supabaseAdmin
        .from("activity_log")
        .select("id, type, title, project_id, created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
      // L'index de recherche. Il était construit par le tableau de bord, donc
      // la recherche n'existait que là ; il monte dans la coquille avec elle.
      // Cette frontière Suspense est déjà isolée (voir client/layout.tsx), donc
      // ces quatre requêtes ne retardent aucune navigation.
      supabaseAdmin.from("projects").select("id, name, category").eq("client_id", userId).limit(SEARCH_LIMIT),
      supabaseAdmin
        .from("documents")
        .select("id, filename")
        .eq("client_id", userId)
        .eq("visibility", "client")
        .order("created_at", { ascending: false })
        .limit(SEARCH_LIMIT),
      supabaseAdmin
        .from("invoices")
        .select("id, reference")
        .eq("client_id", userId)
        .order("issued_at", { ascending: false })
        .limit(SEARCH_LIMIT),
      supabaseAdmin
        .from("quotes")
        .select("id, reference")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(SEARCH_LIMIT),
    ]);

  const searchIndex: PortalSearchItem[] = [
    ...(projects ?? []).map((p) => ({ label: p.name, sublabel: p.category || "Projet", href: `/client/projects/${p.id}` })),
    ...(documents ?? []).map((d) => ({ label: d.filename, sublabel: "Document", href: "/client/documents" })),
    ...(invoices ?? []).map((i) => ({ label: i.reference, sublabel: "Facture", href: "/client/invoices" })),
    ...(quotes ?? []).map((q) => ({ label: q.reference, sublabel: "Devis", href: "/client/quotes" })),
  ];

  const notifications: ClientNotificationItem[] = (recentActivity ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    href: notificationHref(a.type, a.project_id),
    createdAt: a.created_at,
  }));

  return (
    <PortalTopbar
      fullName={profile?.full_name ?? null}
      avatarUrl={getPublicAssetUrl(profile?.avatar_path)}
      unreadCount={unreadCount ?? 0}
      notifications={notifications}
      searchIndex={searchIndex}
    />
  );
}
