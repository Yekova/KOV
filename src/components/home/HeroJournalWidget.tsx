import Link from "next/link";

export interface HeroJournalWidgetPost {
  slug: string;
  title: string;
  tag: string | null;
  publishedAt: string | null;
}

// Same date formatting/meta-row convention as JournalListClient.tsx (the
// real /journal page) — this is meant to read as a small preview of that
// actual section, not an invented "blog widget" style of its own.
function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function HeroJournalWidget({ post }: { post: HeroJournalWidgetPost | null }) {
  return (
    <Link
      href={post ? `/journal/${post.slug}` : "/journal"}
      className="group relative h-full w-full flex flex-col justify-between p-4"
      style={{
        borderRadius: 18,
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Journal</p>
        {post?.tag && (
          <span className="text-kov-red text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-kov-red/40">
            {post.tag}
          </span>
        )}
      </div>

      {post ? (
        <div>
          <h3 className="font-display text-kov-bone uppercase text-sm leading-snug line-clamp-2 group-hover:text-kov-red transition-colors">
            {post.title}
          </h3>
          <p className="mt-2 text-kov-steel text-[10px] uppercase tracking-widest">{formatDate(post.publishedAt)}</p>
        </div>
      ) : (
        <p className="text-kov-steel text-xs">Bientôt sur le Journal.</p>
      )}
    </Link>
  );
}
