import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface HeroJournalPost {
  slug: string;
  title: string;
  tag: string | null;
  excerpt: string | null;
}

export function JournalContent({ post }: { post: HeroJournalPost | null }) {
  return (
    <Link
      href={post ? `/journal/${post.slug}` : "/journal"}
      className="group relative h-full w-full flex flex-col p-4 overflow-hidden"
      style={{ borderRadius: 20 }}
    >
      {/* A real Studio panorama crop, not a fabricated image — desaturated
          and dim at rest so it reads as an abstract texture (spec §19:
          "miniature panoramique abstraite") rather than a literal photo,
          then reveals into full color on hover (spec §20). */}
      <div className="absolute top-3 right-3 w-10 h-10 overflow-hidden rounded-md">
        <Image
          src="/studio/covers/studio-detail-02.webp"
          alt=""
          fill
          sizes="40px"
          className="object-cover transition-all duration-500 grayscale group-hover:grayscale-0"
          style={{ opacity: 0.65 }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
          style={{ background: "rgba(0,0,0,0.35)" }}
        />
      </div>

      <p className="flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
        Journal
      </p>
      <p className="text-kov-steel text-[10px] tabular-nums mt-2">01 —</p>

      <div className="flex-1 min-h-0 flex flex-col justify-center pr-12">
        {post ? (
          <>
            <h3 className="font-display text-kov-bone uppercase text-sm leading-snug line-clamp-3 transition-transform duration-300 group-hover:translate-x-0.5">
              {post.title}
            </h3>
            {post.excerpt && <p className="text-kov-steel text-[11px] mt-1.5 leading-snug line-clamp-2">{post.excerpt}</p>}
          </>
        ) : (
          <p className="text-kov-steel text-xs">Bientôt sur le Journal.</p>
        )}
      </div>

      <span className="self-end inline-flex w-7 h-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
        <ArrowRight size={13} className="text-kov-bone group-hover:text-kov-red transition-colors" />
      </span>
    </Link>
  );
}
