import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

type Project = {
  id: string;
  name: string;
  category: string;
  progress_percent: number;
  thumbnail_url: string | null;
};

export function ActiveProjectsList({ projects }: { projects: Project[] }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Mes projets en cours</p>
        <Link href="/client/projects" className="text-kov-red text-xs hover:underline">
          Voir tous
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-kov-steel text-sm">Aucun projet pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-5">
          {projects.slice(0, 4).map((p) => (
            <li key={p.id}>
              <Link href="/client/projects" className="flex items-center gap-4 group">
                <span
                  className="w-12 h-12 shrink-0 overflow-hidden flex items-center justify-center text-kov-steel text-xs uppercase"
                  style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
                >
                  {p.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    p.name.charAt(0)
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-kov-bone text-sm truncate group-hover:text-kov-red transition-colors">{p.name}</p>
                  <p className="text-kov-steel text-xs mb-1.5">{p.category}</p>
                  <div
                    className="h-1 w-full overflow-hidden"
                    style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
                  >
                    <div
                      className="h-full"
                      style={{ width: `${p.progress_percent}%`, background: "var(--kov-red)" }}
                    />
                  </div>
                </div>
                <span className="text-kov-steel text-xs shrink-0">{p.progress_percent}%</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
