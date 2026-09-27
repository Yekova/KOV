import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComparisonRanges, computeEvolution, getDailyBuckets } from "./period";

export type KpiResult = {
  value: number;
  evolutionPercent: number | null;
  isNew: boolean;
  sparkline: number[];
};

type ProjectRow = {
  status: string;
  created_at: string;
  progress_percent: number;
  next_deadline_date: string | null;
};

// "Active projects" is a point-in-time snapshot — there is no historical
// snapshot table to compare "the active count as of last month" against.
// The evolution shown is a defined, honest proxy: how many projects became
// active (created and still not done) this month vs last month — a real
// flow metric, not a fabricated retrospective of the snapshot itself.
export function getActiveProjectsKpi(projects: ProjectRow[]): KpiResult {
  const activeCount = projects.filter((p) => p.status !== "done").length;
  const { current, previous } = getComparisonRanges("month");

  const becameActiveThisMonth = projects.filter(
    (p) => p.status !== "done" && new Date(p.created_at) >= current.start
  ).length;
  const becameActivePrevMonth = projects.filter(
    (p) =>
      p.status !== "done" &&
      new Date(p.created_at) >= previous.start &&
      new Date(p.created_at) < previous.end
  ).length;

  const { percent, isNew } = computeEvolution(becameActiveThisMonth, becameActivePrevMonth);

  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map(
    (day) => projects.filter((p) => p.status !== "done" && new Date(p.created_at) <= day).length
  );

  return { value: activeCount, evolutionPercent: percent, isNew, sparkline };
}

export async function getNewLeadsKpi(): Promise<KpiResult> {
  const { current, previous } = getComparisonRanges("month");

  const [{ count: currentCount }, { count: previousCount }, { data: currentLeads }] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", current.start.toISOString()),
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", previous.start.toISOString())
      .lt("created_at", previous.end.toISOString()),
    supabaseAdmin.from("leads").select("created_at").gte("created_at", current.start.toISOString()),
  ]);

  const { percent, isNew } = computeEvolution(currentCount ?? 0, previousCount ?? 0);
  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map(
    (day) => (currentLeads ?? []).filter((l) => new Date(l.created_at) <= day).length
  );

  return { value: currentCount ?? 0, evolutionPercent: percent, isNew, sparkline };
}

export async function getMonthlyRevenueKpi(): Promise<KpiResult> {
  const { current, previous } = getComparisonRanges("month");

  const [{ data: currentInvoices }, { data: previousInvoices }] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("amount_cents, paid_at")
      .eq("status", "paid")
      .gte("paid_at", current.start.toISOString()),
    supabaseAdmin
      .from("invoices")
      .select("amount_cents")
      .eq("status", "paid")
      .gte("paid_at", previous.start.toISOString())
      .lt("paid_at", previous.end.toISOString()),
  ]);

  const currentSum = (currentInvoices ?? []).reduce((sum, i) => sum + i.amount_cents, 0);
  const previousSum = (previousInvoices ?? []).reduce((sum, i) => sum + i.amount_cents, 0);
  const { percent, isNew } = computeEvolution(currentSum, previousSum);

  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map((day) =>
    (currentInvoices ?? [])
      .filter((i) => i.paid_at && new Date(i.paid_at) <= day)
      .reduce((sum, i) => sum + i.amount_cents, 0)
  );

  return { value: currentSum, evolutionPercent: percent, isNew, sparkline };
}

// ── Les deux chiffres qui manquaient au tableau de bord ──────────────────
//
// Le dashboard affichait « chiffre d'affaires du mois », calculé sur les
// factures payées. C'est le CA encaissé, et c'est une information — mais
// prise seule elle ne dit rien de ce qui a été vendu. Un studio qui a signé
// pour 2 700 € et encaissé 0 € doit voir les deux nombres l'un à côté de
// l'autre : c'est leur écart qui est l'information, pas leur valeur.
//
// Aucun des deux n'invente quoi que ce soit : le premier somme les devis
// dont le client a dit oui, le second les factures effectivement réglées.

export type MoneySnapshot = {
  signedCents: number;
  signedCount: number;
  collectedCents: number;
  collectedCount: number;
};

// Pas de champ « signé moins encaissé » ici, volontairement. Il supposerait
// que toute facture provienne d'un devis accepté, ce qui n'est pas le cas :
// createInvoice permet d'émettre une facture sans devis, et les données
// actuelles le montrent déjà (5 050 € facturés pour 2 700 € signés). Le
// reste à encaisser se lit sur les factures réellement émises, pas sur une
// soustraction qui aurait l'air juste.

export async function getMoneySnapshot(): Promise<MoneySnapshot> {
  const [{ data: accepted }, { data: paid }] = await Promise.all([
    supabaseAdmin.from("quotes").select("total_cents").eq("status", "accepted"),
    supabaseAdmin.from("invoices").select("amount_cents").eq("status", "paid"),
  ]);

  const signedCents = (accepted ?? []).reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
  const collectedCents = (paid ?? []).reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);

  return {
    signedCents,
    signedCount: (accepted ?? []).length,
    collectedCents,
    collectedCount: (paid ?? []).length,
  };
}

export type ConversionSnapshot = {
  /** Null quand aucun lead n'est encore clos : un taux sans dénominateur
   *  n'est pas un taux, et « 0 % » se lirait comme un échec. */
  percent: number | null;
  won: number;
  resolved: number;
};

/** Le taux de conversion, avec son dénominateur.
 *
 *  Affiché seul, un pourcentage calculé sur deux leads clos ressemble à un
 *  indicateur de vanité — et « 100 % » sur deux dossiers dit surtout qu'on
 *  n'a encore rien perdu. La carte montre donc toujours « n gagnés sur m
 *  clos » à côté : c'est ce qui permet de savoir si le chiffre veut dire
 *  quelque chose.
 *
 *  Aucune évolution mois sur mois : à ce volume, elle serait du bruit
 *  présenté comme une tendance. */
export async function getConversionSnapshot(): Promise<ConversionSnapshot> {
  const { data: statuses } = await supabaseAdmin.from("lead_statuses").select("key, is_won, is_lost");
  const wonKeys = new Set((statuses ?? []).filter((s) => s.is_won).map((s) => s.key as string));
  const lostKeys = new Set((statuses ?? []).filter((s) => s.is_lost).map((s) => s.key as string));

  const { data: leads } = await supabaseAdmin.from("leads").select("status");
  const rows = leads ?? [];

  const won = rows.filter((l) => wonKeys.has(l.status as string)).length;
  const lost = rows.filter((l) => lostKeys.has(l.status as string)).length;
  const resolved = won + lost;

  return { percent: resolved > 0 ? Math.round((won / resolved) * 100) : null, won, resolved };
}
