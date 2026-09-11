import Link from "next/link";

export interface HeroJournalPost {
  slug: string;
  title: string;
  tag: string | null;
}

export function JournalContent({ post }: { post: HeroJournalPost | null }) {
  return (
    <Link
      href={post ? `/journal/${post.slug}` : "/journal"}
      className="group relative h-full w-full flex flex-col justify-between p-4 overflow-hidden"
      style={{ borderRadius: 20 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(circle at 30% 20%, rgba(227,30,36,0.14), transparent 70%)" }}
      />
      <p className="relative text-kov-steel text-[10px] uppercase tracking-widest">Journal · 01</p>

      {post ? (
        <h3 className="relative font-display text-kov-bone uppercase text-sm leading-snug line-clamp-3 group-hover:text-kov-red transition-colors">
          {post.title}
        </h3>
      ) : (
        <p className="relative text-kov-steel text-xs">Bientôt sur le Journal.</p>
      )}

      <span className="relative inline-flex text-kov-bone text-xs group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );
}
