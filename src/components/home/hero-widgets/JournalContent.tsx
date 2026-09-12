import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface HeroJournalPost {
  slug: string;
  title: string;
  tag: string | null;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  readingTime: string | null;
}

// Same date formatting as the real /journal cards (JournalListClient.tsx)
// — this widget is meant to read as a preview of that actual section.
function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function JournalContent({ post }: { post: HeroJournalPost | null }) {
  // A real Studio photo crop as the fallback backdrop (not a fabricated
  // article cover) — only used when this post genuinely has no cover
  // image of its own, same graceful-degradation the real /journal cards
  // use (a flat graphite panel there; a real photo here since this widget
  // has the room for one).
  const imageSrc = post?.coverUrl ?? "/studio/covers/studio-detail-02.webp";

  return (
    <Link href={post ? `/journal/${post.slug}` : "/journal"} className="group relative flex h-full w-full flex-col overflow-hidden" style={{ borderRadius: 20 }}>
      <div className="relative" style={{ height: "56%" }}>
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 15vw, 40vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(7,7,7,0.95) 0%, transparent 55%)" }}
        />
        <p className="absolute top-3 left-3 flex items-center gap-2 text-kov-bone text-[10px] uppercase tracking-widest">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
          Journal
        </p>
        {post?.tag && (
          <span
            className="absolute top-3 right-3 text-[9px] uppercase tracking-widest px-2 py-1 text-kov-bone"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 999 }}
          >
            {post.tag}
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col justify-between p-4">
        {post ? (
          <>
            <div>
              <p className="text-kov-steel text-[10px] uppercase tracking-widest">
                {formatDate(post.publishedAt)}
                {post.readingTime && ` · ${post.readingTime}`}
              </p>
              <h3 className="font-display text-kov-bone uppercase text-sm leading-snug mt-1 line-clamp-2 transition-transform duration-300 group-hover:translate-x-0.5">
                {post.title}
              </h3>
            </div>
            {post.excerpt && <p className="text-kov-steel text-[11px] leading-snug mt-1 line-clamp-2">{post.excerpt}</p>}
          </>
        ) : (
          <p className="text-kov-steel text-xs">Bientôt sur le Journal.</p>
        )}

        <span
          className="self-end inline-flex w-7 h-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
          style={{ border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <ArrowRight size={13} className="text-kov-bone group-hover:text-kov-red transition-colors" />
        </span>
      </div>
    </Link>
  );
}
