import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { markActivityRead } from "./actions";
import { GreetingSearchPanel, type PortalSearchItem } from "@/components/client/dashboard/GreetingSearchPanel";
import { StatusDonutCard } from "@/components/client/dashboard/StatusDonutCard";
import { NextDeadlineCard } from "@/components/client/dashboard/NextDeadlineCard";
import { AccountManagerCard } from "@/components/client/dashboard/AccountManagerCard";
import { ActiveProjectsList } from "@/components/client/dashboard/ActiveProjectsList";
import { RecentActivityFeed } from "@/components/client/dashboard/RecentActivityFeed";

export const metadata: Metadata = {
  title: "Tableau de bord — KOV",
};

export default async function ClientDashboardPage() {
  const user = await requireUser();

  const [{ data: profile }, { data: projects }, { data: documents }, { data: invoices }, { data: quotes }, { data: activity }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, account_manager_id").eq("id", user.id).maybeSingle(),
      supabaseAdmin
        .from("projects")
        .select("id, name, category, status, progress_percent, thumbnail_path, next_deadline_date, deadline_phase_label")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("documents")
        .select("id, filename")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("invoices")
        .select("id, reference")
        .eq("client_id", user.id)
        .order("issued_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("quotes")
        .select("id, reference")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("activity_log")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  await markActivityRead(user.id);

  const projectRows = projects ?? [];

  const manager = profile?.account_manager_id
    ? await supabaseAdmin
        .from("profiles")
        .select("full_name, display_title, avatar_path, is_online")
        .eq("id", profile.account_manager_id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const nextDeadlineProject =
    projectRows
      .filter((p) => p.next_deadline_date)
      .sort(
        (a, b) => new Date(a.next_deadline_date).getTime() - new Date(b.next_deadline_date).getTime()
      )[0] ?? null;

  const searchIndex: PortalSearchItem[] = [
    ...projectRows.map((p) => ({ label: p.name, sublabel: p.category, href: "/client/projects" })),
    ...(documents ?? []).map((d) => ({ label: d.filename, sublabel: "Document", href: "/client/documents" })),
    ...(invoices ?? []).map((i) => ({ label: i.reference, sublabel: "Facture", href: "/client/invoices" })),
    ...(quotes ?? []).map((q) => ({ label: q.reference, sublabel: "Devis", href: "/client/quotes" })),
  ];

  return (
    <div className="relative isolate">
      {/* Same pattern as the admin dashboard (src/app/admin/page.tsx) — see
          that file's comment for why this is `absolute`, not `fixed`, and
          why the wrapper needs `isolate`. A different photo than admin's,
          so the two portals don't feel like the same backdrop reused. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/character/contact-frames/frame-040.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none -z-10"
      />
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, var(--kov-black) 85%)" }} />

      <main className="relative px-6 md:px-10 py-10 max-w-[1800px] mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <GreetingSearchPanel fullName={profile?.full_name ?? null} searchIndex={searchIndex} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatusDonutCard projects={projectRows} />
              <NextDeadlineCard project={nextDeadlineProject} today={new Date()} />
              <AccountManagerCard
                manager={
                  manager
                    ? {
                        full_name: manager.full_name,
                        display_title: manager.display_title,
                        avatar_url: getPublicAssetUrl(manager.avatar_path),
                        is_online: manager.is_online,
                      }
                    : null
                }
              />
            </div>
          </div>

          <div className="space-y-6">
            <ActiveProjectsList
              projects={projectRows.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                progress_percent: p.progress_percent,
                thumbnail_url: getPublicAssetUrl(p.thumbnail_path),
              }))}
            />
            <RecentActivityFeed items={activity ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
