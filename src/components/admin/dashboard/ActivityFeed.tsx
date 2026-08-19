import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { type ActivityType } from "@/lib/portal/status";

export type AdminActivityItem = {
  id: string;
  type: string;
  title: string;
  admin_title: string | null;
  created_at: string;
};

const ICON_PATHS: Record<ActivityType, React.ReactNode> = {
  document: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </>
  ),
  message: <path d="M4 5h16v11H8l-4 4V5z" />,
  invoice: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M3 10h18" />
    </>
  ),
  milestone: <path d="M20 6L9 17l-5-5" />,
};

function isKnownType(type: string): type is ActivityType {
  return type in ICON_PATHS;
}

export function ActivityFeed({ items }: { items: AdminActivityItem[] }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Activité récente</p>
      </div>

      {items.length === 0 ? (
        <EmptyState message="Aucune activité pour l'instant." />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className="w-8 h-8 shrink-0 flex items-center justify-center text-kov-red"
                style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isKnownType(item.type) ? ICON_PATHS[item.type] : null}
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                {/* admin_title is nullable for rows written before this column
                    existed — fall back to the client-facing title with a
                    generic actor, per the documented migration comment. */}
                <p className="text-kov-bone text-sm">{item.admin_title ?? `Équipe KOV — ${item.title}`}</p>
              </div>
              <span className="text-kov-steel text-xs shrink-0">{formatRelativeTime(item.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
