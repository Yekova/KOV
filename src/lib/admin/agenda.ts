import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// L'agenda du studio : toutes les échéances datées, rassemblées.
//
// Elles existaient déjà, dispersées dans quatre tables — une tâche à rendre,
// une échéance de projet, la validité d'un devis, une facture à encaisser —
// et aucun écran ne les mettait côte à côte. Savoir ce qui tombe cette
// semaine demandait d'ouvrir quatre pages et de faire le tri de tête.
//
// Rien n'est inventé ici : chaque ligne correspond à une date saisie par
// quelqu'un. Une échéance non renseignée n'apparaît pas, elle n'est pas
// estimée.

export type AgendaKind = "task" | "project" | "phase" | "quote" | "invoice";

export interface AgendaEvent {
  id: string;
  kind: AgendaKind;
  label: string;
  detail: string | null;
  date: string;
  href: string;
  /** Une échéance dépassée qui n'est pas close. Se lit avant le reste. */
  overdue: boolean;
}

const DAY = 86_400_000;

export async function getAgenda(windowDays = 21): Promise<AgendaEvent[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const horizon = new Date(today.getTime() + windowDays * DAY);
  const horizonIso = horizon.toISOString().slice(0, 10);

  const [{ data: tasks }, { data: projects }, { data: phases }, { data: quotes }, { data: invoices }] =
    await Promise.all([
      supabaseAdmin
        .from("project_tasks")
        .select("id, title, due_date, status, project_id")
        .not("due_date", "is", null)
        .neq("status", "done")
        .lte("due_date", horizonIso),
      supabaseAdmin
        .from("projects")
        .select("id, name, next_deadline_date, deadline_phase_label, status")
        .not("next_deadline_date", "is", null)
        .neq("status", "done")
        .lte("next_deadline_date", horizonIso),
      supabaseAdmin
        .from("project_phases")
        .select("id, name, due_date, status, project_id")
        .not("due_date", "is", null)
        .neq("status", "completed")
        .lte("due_date", horizonIso),
      supabaseAdmin
        .from("quotes")
        .select("id, reference, recipient_name, valid_until, status")
        .not("valid_until", "is", null)
        .eq("status", "sent")
        .lte("valid_until", horizonIso),
      supabaseAdmin
        .from("invoices")
        .select("id, reference, due_at, status, client_id")
        .not("due_at", "is", null)
        .in("status", ["sent", "overdue"])
        .lte("due_at", horizon.toISOString()),
    ]);

  const dayOf = (value: string) => value.slice(0, 10);
  const isPast = (value: string) => new Date(`${dayOf(value)}T00:00:00`) < today;

  const events: AgendaEvent[] = [
    ...(tasks ?? []).map((task) => ({
      id: `task-${task.id}`,
      kind: "task" as const,
      label: task.title as string,
      detail: "Tâche",
      date: dayOf(task.due_date as string),
      href: "/admin/tasks",
      overdue: isPast(task.due_date as string),
    })),
    ...(projects ?? []).map((project) => ({
      id: `project-${project.id}`,
      kind: "project" as const,
      label: project.name as string,
      detail: (project.deadline_phase_label as string | null) ?? "Jalon de projet",
      date: dayOf(project.next_deadline_date as string),
      href: `/admin/projects/${project.id}`,
      overdue: isPast(project.next_deadline_date as string),
    })),
    ...(phases ?? []).map((phase) => ({
      id: `phase-${phase.id}`,
      kind: "phase" as const,
      label: phase.name as string,
      detail: "Fin de phase",
      date: dayOf(phase.due_date as string),
      href: `/admin/projects/${phase.project_id}`,
      overdue: isPast(phase.due_date as string),
    })),
    ...(quotes ?? []).map((quote) => ({
      id: `quote-${quote.id}`,
      kind: "quote" as const,
      label: `Devis ${quote.reference}`,
      detail: `Validité — ${quote.recipient_name}`,
      date: dayOf(quote.valid_until as string),
      href: "/admin/quotes",
      overdue: isPast(quote.valid_until as string),
    })),
    ...(invoices ?? []).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      kind: "invoice" as const,
      label: `Facture ${invoice.reference}`,
      detail: "Échéance de paiement",
      date: dayOf(invoice.due_at as string),
      href: `/admin/clients/${invoice.client_id}`,
      overdue: isPast(invoice.due_at as string),
    })),
  ];

  // En retard d'abord, puis par date. Ce qui est dépassé ne doit jamais
  // passer sous ce qui vient — c'est précisément ce qu'on oublie.
  return events.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
}
