// Deterministic, from real signals only (Leads Workspace spec, section 7:
// "ne pas inventer des données") — no field here is fabricated, every input
// is a column that already exists or a count of real rows. Weights are a
// starting point, not a finished model — see the module comment below for
// where to adjust as real usage reveals what actually correlates with wins.
//
// Budget/status/source thresholds are the only "judgment calls" baked in:
// - status: further along the pipeline = hotter, `won` maxes it, `lost` zeroes it.
// - budget: higher declared budget = more qualified intent.
// - source: 'recommandation' scores slightly higher — referrals convert
//   better in most agencies' real experience, not a KOV-specific measurement.
// - interactions: more logged touchpoints = more engaged.
// - freshness: a brand-new lead gets a small boost (respond fast while hot);
//   this decays after two weeks, it does not penalize old-but-active leads
//   (that's what the status/interaction terms are for).
//
// Pure functions only — no "server-only"/supabaseAdmin here on purpose, so
// LeadCard/LeadsListView (client components) can import the tier
// labels/colors directly. The DB read/write side lives in
// src/lib/leads/recomputeScore.ts.
const STATUS_BASE_SCORE: Record<string, number> = {
  new: 5,
  contacted: 15,
  qualified: 25,
  proposal: 32,
  negotiation: 38,
  dormant: 5,
};

export interface LeadScoreInput {
  status: string;
  statusIsWon: boolean;
  statusIsLost: boolean;
  source: string | null;
  budgetCents: number | null;
  createdAt: string;
  interactionCount: number;
}

export function computeLeadScore(input: LeadScoreInput): number {
  if (input.statusIsLost) return 0;

  let score = input.statusIsWon ? 40 : (STATUS_BASE_SCORE[input.status] ?? 10);

  if (input.budgetCents) {
    if (input.budgetCents >= 2_000_000) score += 25;
    else if (input.budgetCents >= 1_000_000) score += 18;
    else if (input.budgetCents >= 500_000) score += 12;
    else score += 6;
  }

  if (input.source === "recommandation") score += 10;
  else if (input.source === "linkedin") score += 6;
  else if (input.source) score += 3;

  score += Math.min(15, input.interactionCount * 3);

  const ageDays = (Date.now() - new Date(input.createdAt).getTime()) / 86_400_000;
  if (ageDays <= 3) score += 10;
  else if (ageDays <= 14) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export type LeadScoreTier = "hot" | "warm" | "cold";

export function leadScoreTier(score: number | null): LeadScoreTier | null {
  if (score === null) return null;
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export const LEAD_SCORE_TIER_LABELS: Record<LeadScoreTier, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

export const LEAD_SCORE_TIER_COLORS: Record<LeadScoreTier, string> = {
  hot: "var(--kov-red)",
  warm: "#E39A2D",
  cold: "var(--kov-steel)",
};
