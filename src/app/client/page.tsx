import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { deriveCurrentPhase, deriveProgress, type ProjectPhase } from "@/lib/portal/progress";
import { isInvoiceOverdue } from "@/lib/portal/status";
import { ActionRequiredCard, type ActionItem } from "@/components/client/dashboard/ActionRequiredCard";
import { DashboardHero } from "@/components/client/dashboard/DashboardHero";
import { ProjectShowcase, type ShowcaseProject } from "@/components/client/dashboard/ProjectShowcase";
import { UpcomingDeadlines, type Deadline } from "@/components/client/dashboard/UpcomingDeadlines";
import { RecentDocuments, type RecentDocument } from "@/components/client/dashboard/RecentDocuments";
import { BillingSummary, type BillingRow } from "@/components/client/dashboard/BillingSummary";
import { AccountManagerCard } from "@/components/client/dashboard/AccountManagerCard";
import { RecentActivityFeed } from "@/components/client/dashboard/RecentActivityFeed";

export const metadata: Metadata = {
  title: "Tableau de bord — KOV",
};

/** Combien d'échéances et de documents la page montre avant de renvoyer
 *  vers l'écran qui les liste tous. */
const SHORTLIST = 5;

function toIsoDay(value: string): string {
  return value.slice(0, 10);
}

export default async function ClientDashboardPage() {
  const user = await requireUser();

  const [{ data: profile }, { data: projects }, { data: documents }, { data: invoices }, { data: quotes }, { data: activity }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, account_manager_id").eq("id", user.id).maybeSingle(),
      supabaseAdmin
        .from("projects")
        // Une seule chaîne littérale, jamais concaténée : supabase-js infère le
        // type des colonnes depuis le littéral, et une concaténation le fait
        // retomber sur GenericStringError.
        .select(
          "id, name, category, status, progress_percent, thumbnail_path, next_deadline_date, deadline_phase_label, project_phases(id, name, status, position, due_date)"
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("documents")
        .select("id, filename, size_bytes, created_at")
        .eq("client_id", user.id)
        .eq("visibility", "client")
        .order("created_at", { ascending: false })
        .limit(SHORTLIST),
      supabaseAdmin
        .from("invoices")
        .select("id, reference, status, due_at, paid_at, amount_cents, currency")
        .eq("client_id", user.id)
        .order("issued_at", { ascending: false }),
      supabaseAdmin
        .from("quotes")
        .select("id, reference, status, signed_at, signing_url")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("activity_log")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  // Les phases font foi dès qu'il y en a : voir lib/portal/progress.ts.
  const projectRows = (projects ?? []).map((project) => {
    const phases = (project.project_phases ?? []) as ProjectPhase[];
    const progress = deriveProgress(phases, project.progress_percent);
    const current = deriveCurrentPhase(phases, project.deadline_phase_label);
    return { project, phases, progress, current };
  });

  const manager = profile?.account_manager_id
    ? await supabaseAdmin
        .from("profiles")
        .select("full_name, display_title, avatar_path, is_online")
        .eq("id", profile.account_manager_id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const showcase: ShowcaseProject[] = projectRows.map(({ project, progress, current }) => ({
    id: project.id,
    name: project.name,
    category: project.category,
    status: project.status,
    progressPercent: progress.percent,
    progressSource: progress.source,
    currentPhase: current.label,
    nextDeadline: project.next_deadline_date,
    thumbnailUrl: getPublicAssetUrl(project.thumbnail_path),
  }));

  // ── Les échéances ─────────────────────────────────────────────────────
  //
  // Deux sources réelles, jamais une date fabriquée : l'échéance posée sur
  // le projet, et la date due des phases qui ne sont pas terminées. Les
  // doublons sont écartés par leur jour, pour qu'une phase et un projet qui
  // tombent le même jour ne s'affichent pas deux fois.
  const todayIso = new Date().toISOString().slice(0, 10);
  const deadlines: Deadline[] = [];
  const seenDays = new Set<string>();

  for (const { project, phases, current } of projectRows) {
    if (project.next_deadline_date) {
      seenDays.add(`${project.id}-${project.next_deadline_date}`);
      deadlines.push({
        id: `project-${project.id}`,
        date: project.next_deadline_date,
        label: current.label ?? "Prochaine étape",
        projectId: project.id,
        projectName: project.name,
        overdue: project.next_deadline_date < todayIso,
      });
    }
    for (const phase of phases) {
      if (!phase.due_date || phase.status === "completed") continue;
      const day = toIsoDay(phase.due_date);
      const key = `${project.id}-${day}`;
      if (seenDays.has(key)) continue;
      seenDays.add(key);
      deadlines.push({
        id: `phase-${phase.id}`,
        date: day,
        label: phase.name,
        projectId: project.id,
        projectName: project.name,
        overdue: day < todayIso,
      });
    }
  }
  deadlines.sort((a, b) => a.date.localeCompare(b.date));

  // ── Ce qui attend le client ───────────────────────────────────────────
  const invoiceRows = invoices ?? [];
  const actionItems: ActionItem[] = [
    ...(quotes ?? [])
      .filter((quote) => quote.status === "sent" && !quote.signed_at)
      .map((quote) => ({
        id: `quote-${quote.id}`,
        label: `Devis ${quote.reference} à signer`,
        detail: quote.signing_url ? "Signature électronique en attente" : "En attente de votre retour",
        href: "/client/quotes",
        urgent: true,
      })),
    ...invoiceRows
      .filter((invoice) => isInvoiceOverdue(invoice.status, invoice.due_at))
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        label: `Facture ${invoice.reference} en retard`,
        detail: `Échéance dépassée le ${new Date(invoice.due_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
        href: "/client/invoices",
        urgent: true,
      })),
    ...invoiceRows
      .filter((invoice) => invoice.status === "sent" && !isInvoiceOverdue(invoice.status, invoice.due_at))
      .map((invoice) => ({
        id: `invoice-due-${invoice.id}`,
        label: `Facture ${invoice.reference} à régler`,
        detail: invoice.due_at
          ? `Avant le ${new Date(invoice.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
          : "Sans échéance",
        href: "/client/invoices",
      })),
  ];

  // ── La facturation ────────────────────────────────────────────────────
  //
  // Des sommes, pas des estimations. paid_at existe en base depuis la
  // migration 20260819110200, donc la comparaison mensuelle est un fait
  // et non une tendance devinée.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  let outstandingCents = 0;
  let paidThisMonthCents = 0;
  let paidLastMonthCents = 0;
  for (const invoice of invoiceRows) {
    if (invoice.status === "sent") outstandingCents += invoice.amount_cents;
    if (invoice.status === "paid" && invoice.paid_at) {
      const paidAt = new Date(invoice.paid_at).getTime();
      if (paidAt >= monthStart) paidThisMonthCents += invoice.amount_cents;
      else if (paidAt >= previousMonthStart) paidLastMonthCents += invoice.amount_cents;
    }
  }

  const billingRows: BillingRow[] = invoiceRows.slice(0, 3).map((invoice) => {
    const overdue = isInvoiceOverdue(invoice.status, invoice.due_at);
    return {
      id: invoice.id,
      reference: invoice.reference,
      amountCents: invoice.amount_cents,
      currency: invoice.currency,
      label: overdue
        ? "En retard"
        : invoice.status === "paid"
          ? "Payée"
          : invoice.status === "sent"
            ? "À régler"
            : "Brouillon",
      color: overdue ? "var(--kov-red)" : invoice.status === "paid" ? "#3FB27F" : "#F5A524",
    };
  });

  const recentDocuments: RecentDocument[] = (documents ?? []).map((document) => ({
    id: document.id,
    filename: document.filename,
    sizeBytes: document.size_bytes,
    createdAt: document.created_at,
  }));

  return (
    <main className="mx-auto w-full max-w-[1800px] px-6 py-8 md:px-10">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* La colonne large porte ce sur quoi on agit, l'étroite ce qui
            s'est passé. C'est la seule division qui tienne sur cet écran. */}
        <div className="space-y-6 xl:col-span-2">
          <DashboardHero fullName={profile?.full_name ?? null} />

          <ActionRequiredCard items={actionItems} />

          <ProjectShowcase projects={showcase} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <UpcomingDeadlines deadlines={deadlines.slice(0, SHORTLIST)} />
            <RecentDocuments documents={recentDocuments} />
          </div>
        </div>

        <div className="space-y-6">
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
          <BillingSummary
            outstandingCents={outstandingCents}
            currency={invoiceRows[0]?.currency ?? "EUR"}
            paidThisMonthCents={paidThisMonthCents}
            paidLastMonthCents={paidLastMonthCents}
            rows={billingRows}
          />
          <RecentActivityFeed items={activity ?? []} />
        </div>
      </div>
    </main>
  );
}
