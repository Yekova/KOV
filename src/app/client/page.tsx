import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { getDashboardLayout } from "@/lib/dashboard/actions";
import { deriveCurrentPhase, deriveProgress, type ProjectPhase } from "@/lib/portal/progress";
import { isInvoiceOverdue } from "@/lib/portal/status";
import { ActionRequiredCard, type ActionItem } from "@/components/client/dashboard/ActionRequiredCard";
import { DashboardHero } from "@/components/client/dashboard/DashboardHero";
import { ProjectShowcase, type ShowcaseProject } from "@/components/client/dashboard/ProjectShowcase";
import { ProjectStoryCard, type FeaturedProject } from "@/components/client/dashboard/ProjectStoryCard";
import { RelationPanel } from "@/components/client/dashboard/RelationPanel";
import { UpcomingDeadlines, type Deadline } from "@/components/client/dashboard/UpcomingDeadlines";
import { RecentDocuments, type RecentDocument } from "@/components/client/dashboard/RecentDocuments";

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

  // Le projet principal : celui qui avance. À défaut, le plus récent.
  // Jamais choisi au hasard, et jamais inventé quand il n'y en a aucun.
  const featuredRow =
    projectRows.find(({ project }) => project.status === "in_progress") ??
    projectRows.find(({ project }) => project.status !== "done") ??
    projectRows[0] ??
    null;

  const featured: FeaturedProject | null = featuredRow
    ? {
        id: featuredRow.project.id,
        name: featuredRow.project.name,
        category: featuredRow.project.category,
        status: featuredRow.project.status,
        progressPercent: featuredRow.progress.percent,
        currentPhase: featuredRow.current.label,
        nextDeadline: featuredRow.project.next_deadline_date,
        phases: [...featuredRow.phases]
          .sort((a, b) => a.position - b.position)
          .map((phase) => ({ id: phase.id, name: phase.name, status: phase.status, dueDate: phase.due_date ?? null })),
      }
    : null;

  const showcase: ShowcaseProject[] = projectRows
    .filter(({ project }) => project.id !== featured?.id)
    .map(({ project, progress, current }) => ({
    id: project.id,
    name: project.name,
    category: project.category,
    status: project.status,
    progressPercent: progress.percent,
    progressSource: progress.source,
    currentPhase: current.label,
    nextDeadline: project.next_deadline_date,
  }));

  // Le visuel du hero vient du projet principal quand il en a un. Sinon le
  // visuel KOV — jamais l'image d'un autre projet.

  // Une phrase d'état, ou rien. Elle ne se remplit que de ce qui est vrai.
  const statusLine = featured
    ? featured.currentPhase
      ? `« ${featured.name} » avance : étape ${featured.currentPhase.toLowerCase()}.`
      : `« ${featured.name} » est en cours.`
    : null;

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
        href: "/client/invoices",
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
  // Le total dû, et rien d'autre : la comparaison mensuelle vit sur
  // l'écran de facturation, où elle a un tableau autour d'elle pour la
  // rendre lisible. Ici, c'est une ligne dans le panneau Relation.
  let outstandingCents = 0;
  for (const invoice of invoiceRows) {
    if (invoice.status === "sent") outstandingCents += invoice.amount_cents;
  }

  const recentDocuments: RecentDocument[] = (documents ?? []).map((document) => ({
    id: document.id,
    filename: document.filename,
    sizeBytes: document.size_bytes,
    createdAt: document.created_at,
  }));

  const dashboardLayout = await getDashboardLayout("client");

  return (
    <main className="mx-auto w-full max-w-[1700px] px-6 py-8 md:px-10">
      {/* La composition répond aux cinq questions du client, dans l'ordre
          où il se les pose : où en suis-je (hero), que dois-je faire
          (action), où en est mon projet (projet principal), quand
          (échéances), avec quoi (documents), et qui je contacte (relation).

          Trois surfaces primaires seulement — hero, projet principal,
          relation — et le reste en retrait. C'est ce qui remplace la
          grille de cartes équivalentes. */}
      {/* L'en-tête sort de la grille et la surplombe, comme au tableau de
          bord du studio : il s'adresse à quelqu'un, il n'est pas une carte
          parmi d'autres. */}
      <DashboardHero fullName={profile?.full_name ?? null} statusLine={statusLine} />

      {/* La composition d'origine devient l'arrangement PAR DÉFAUT : le
          client la retrouve telle quelle tant qu'il n'y touche pas, et
          peut ensuite déplacer, redimensionner ou masquer chaque carte.
          Les blocs sont rendus ici, côté serveur ; seul leur agencement
          vit dans le navigateur. */}
      <DashboardGrid
        surface="client"
        initialLayout={dashboardLayout}
        blocks={{
          "action-required": <ActionRequiredCard items={actionItems} />,
          relation: (
            <RelationPanel
              manager={
                manager
                  ? {
                      fullName: manager.full_name,
                      displayTitle: manager.display_title,
                      avatarUrl: getPublicAssetUrl(manager.avatar_path),
                      isOnline: manager.is_online,
                    }
                  : null
              }
              outstandingCents={outstandingCents}
              currency={invoiceRows[0]?.currency ?? "EUR"}
              activity={(activity ?? []).map((row) => ({
                id: row.id,
                title: row.title,
                createdAt: row.created_at,
              }))}
            />
          ),
          "project-story": featured ? <ProjectStoryCard project={featured} /> : undefined,
          "project-showcase": showcase.length > 0 ? <ProjectShowcase projects={showcase} /> : undefined,
          deadlines: <UpcomingDeadlines deadlines={deadlines.slice(0, SHORTLIST)} />,
          documents: <RecentDocuments documents={recentDocuments} />,
        }}
      />
    </main>
  );
}
