import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { StatCard } from "@/components/admin/StatCard";
import { EmailListView } from "@/components/email/EmailListView";

export const metadata: Metadata = { title: "Emails — Admin KOV" };

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };

export default async function AdminEmailsPage(props: PageProps<"/admin/emails">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const periodParam = typeof searchParams.period === "string" ? searchParams.period : "30d";
  const period = periodParam in PERIOD_DAYS ? periodParam : "30d";
  // Server Component executed once per request, not re-rendered client-side —
  // "now" for a period filter is legitimately request-time data, not impure
  // render output (same rationale as AdminTopbarData.tsx).
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - PERIOD_DAYS[period] * 86_400_000);

  const { data: logs } = await supabaseAdmin
    .from("email_logs")
    .select("id, lead_id, template_id, subject, recipient, status, sent_at, delivered_at, opened_at, clicked_at, failed_at, created_at")
    .order("created_at", { ascending: false });

  const rows = logs ?? [];

  const leadIds = Array.from(new Set(rows.map((r) => r.lead_id).filter((id): id is string => !!id)));
  let leadNames = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: leads } = await supabaseAdmin.from("leads").select("id, name").in("id", leadIds);
    leadNames = new Map((leads ?? []).map((l) => [l.id, l.name]));
  }

  const templateIds = Array.from(new Set(rows.map((r) => r.template_id).filter((id): id is string => !!id)));
  let templateNames = new Map<string, string>();
  if (templateIds.length > 0) {
    const { data: templates } = await supabaseAdmin.from("email_templates").select("id, name").in("id", templateIds);
    templateNames = new Map((templates ?? []).map((t) => [t.id, t.name]));
  }

  const items = rows.map((r) => ({
    id: r.id,
    leadId: r.lead_id,
    leadName: r.lead_id ? (leadNames.get(r.lead_id) ?? r.recipient) : r.recipient,
    templateName: r.template_id ? (templateNames.get(r.template_id) ?? null) : null,
    subject: r.subject,
    status: r.status,
    sentAt: r.sent_at,
    deliveredAt: r.delivered_at,
    openedAt: r.opened_at,
    clickedAt: r.clicked_at,
    failedAt: r.failed_at,
    createdAt: r.created_at,
  }));

  const periodRows = rows.filter((r) => new Date(r.created_at) >= since && r.status !== "draft");
  const sentCount = periodRows.filter((r) => r.sent_at).length;
  const deliveredCount = periodRows.filter((r) => r.delivered_at).length;
  const openedCount = periodRows.filter((r) => r.opened_at).length;
  const clickedCount = periodRows.filter((r) => r.clicked_at).length;
  const failedCount = periodRows.filter((r) => r.status === "failed" || r.status === "bounced").length;

  const deliverabilityRate = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
  const openRate = deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : 0;
  const clickRate = openedCount > 0 ? Math.round((clickedCount / openedCount) * 100) : 0;

  function periodHref(p: string) {
    return `?period=${p}`;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h1 className="font-display text-kov-bone text-2xl uppercase">Emails</h1>
        <p className="text-kov-steel text-sm mt-1">Historique, brouillons et performance des envois.</p>
      </div>

      <div className="flex items-center gap-2">
        {(["7d", "30d", "90d", "1y"] as const).map((p) => (
          <Link
            key={p}
            href={periodHref(p)}
            className="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
            style={{
              borderColor: period === p ? "var(--kov-red)" : "var(--kov-border)",
              color: period === p ? "var(--kov-red)" : "var(--kov-steel)",
              borderRadius: "var(--radius-pill)",
            }}
          >
            {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : p === "90d" ? "90 jours" : "Année"}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Envoyés" value={String(sentCount)} caption="Sur la période" />
        <StatCard label="Délivrés" value={String(deliveredCount)} caption="Sur la période" />
        <StatCard label="Ouverts" value={String(openedCount)} caption="Sur la période" />
        <StatCard label="Cliqués" value={String(clickedCount)} caption="Sur la période" />
        <StatCard label="Échecs" value={String(failedCount)} caption="Sur la période" />
        <StatCard label="Délivrabilité" value={`${deliverabilityRate}%`} caption={`Ouverture ${openRate}% · Clic ${clickRate}%`} />
      </div>

      <EmailListView items={items} />
    </main>
  );
}
