import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface LeadStatusRow {
  key: string;
  label: string;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  isProtected: boolean;
  isActive: boolean;
}

// The single read path for the admin-configurable lead pipeline — see
// /admin/settings/lead-statuses. Ordered by position so every consumer
// (list tabs, Kanban columns, funnel chart) shows stages in the same order
// without re-sorting.
export async function getLeadStatuses(): Promise<LeadStatusRow[]> {
  const { data } = await supabaseAdmin
    .from("lead_statuses")
    .select("key, label, color, position, is_won, is_lost, is_protected, is_active")
    .order("position", { ascending: true });

  return (data ?? []).map((row) => ({
    key: row.key,
    label: row.label,
    color: row.color,
    position: row.position,
    isWon: row.is_won,
    isLost: row.is_lost,
    isProtected: row.is_protected,
    isActive: row.is_active,
  }));
}
