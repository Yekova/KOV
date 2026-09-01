"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DOMPurify from "dompurify";
import { Calendar, Clock, Eye, User, ChevronRight, ArrowRight } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { injectHeadingIds, extractTOC, type TocItem } from "@/lib/journal/toc";
import { TableOfContents } from "./TableOfContents";
import { ReadingProgress } from "./ReadingProgress";
import { LikeButton } from "./LikeButton";
import { ShareMenu } from "./ShareMenu";
import { AudioPlayer } from "./AudioPlayer";
import { BrowserTTSPlayer } from "./BrowserTTSPlayer";
import { Button } from "@/components/ui/Button";
import type { JournalPostSummary } from "./journalTypes";

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  clientDisplayName: string | null;
  publishedAt: string | null;
  tag: string | null;
  readingTime: string | null;
  authorName: string | null;
  audioUrl: string | null;
  views: number;
  likes: number;
}

const CARD_STYLE = {
  background: "var(--kov-carbon)",
  border: "1px solid var(--kov-border)",
  borderRadius: "var(--radius-md)",
} as const;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ArticleDetail({ article, related }: { article: JournalArticle; related: JournalPostSummary[] }) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState(article.body);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [readPercent, setReadPercent] = useState(0);

  useEffect(() => {
    // DOMParser/DOMPurify are browser-only — this derived state can only be
    // computed after mount, never during SSR render, so it can't move to useMemo.
    const withIds = injectHeadingIds(article.body);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBody(DOMPurify.sanitize(withIds));
    setToc(extractTOC(withIds));
  }, [article.body]);

  useEffect(() => {
    const key = `kov_viewed_${article.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    createBrowserSupabaseClient().rpc("increment_post_views", { post_id: article.id });
  }, [article.id]);

  return (
    <main className="min-h-screen">
      <ReadingProgress targetRef={articleRef} onPercentChange={setReadPercent} />

      <div className="px-6 pt-40 pb-32">
        <div className="max-w-[1400px] mx-auto">
          <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-xs uppercase tracking-widest text-kov-steel mb-8">
            <Link href="/" className="hover:text-kov-red transition-colors">
              Accueil
            </Link>
            <ChevronRight size={12} />
            <Link href="/journal" className="hover:text-kov-red transition-colors">
              Journal
            </Link>
            <ChevronRight size={12} />
            <span className="text-kov-bone truncate max-w-[240px]">{article.title}</span>
          </nav>

          <div className="max-w-3xl">
            {article.tag && (
              <Link
                href={`/journal?tag=${encodeURIComponent(article.tag)}`}
                className="inline-block text-kov-red text-xs uppercase tracking-widest mb-4 hover:text-kov-red-signal transition-colors"
              >
                {article.tag}
              </Link>
            )}
            <h1 className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-kov-steel text-xs uppercase tracking-widest">
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} strokeWidth={1.5} /> {formatDate(article.publishedAt)}
                </span>
              )}
              {article.readingTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} strokeWidth={1.5} /> {article.readingTime}
                </span>
              )}
              {(article.authorName || article.clientDisplayName) && (
                <span className="inline-flex items-center gap-1.5">
                  <User size={13} strokeWidth={1.5} /> {article.authorName ?? article.clientDisplayName}
                </span>
              )}
              {article.views > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={13} strokeWidth={1.5} /> {article.views} vue{article.views > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <LikeButton postId={article.id} initialLikes={article.likes} />
              <ShareMenu title={article.title} url={`https://kov-agency.site/journal/${article.slug}`} />
            </div>
          </div>

          {article.coverUrl && (
            <div className="relative mt-12 overflow-hidden" style={{ aspectRatio: "21/9", borderRadius: "var(--radius-md)" }}>
              <Image src={article.coverUrl} alt="" fill sizes="100vw" className="object-cover" priority />
            </div>
          )}

          <div ref={articleRef} className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16 mt-12">
            <div className="min-w-0 max-w-2xl">
              {article.excerpt && (
                <p className="text-kov-bone text-lg leading-relaxed mb-8" style={{ fontWeight: 300 }}>
                  {article.excerpt}
                </p>
              )}

              {article.audioUrl ? <AudioPlayer src={article.audioUrl} /> : <BrowserTTSPlayer text={article.body} />}

              <div className="kov-post-body mt-10" dangerouslySetInnerHTML={{ __html: body }} />
            </div>

            <aside className="lg:sticky self-start space-y-8" style={{ top: 96 }}>
              <TableOfContents items={toc} />

              <div className="p-5" style={CARD_STYLE}>
                <p className="text-xs uppercase tracking-widest text-kov-steel mb-2">Progression</p>
                <div className="h-1.5 w-full overflow-hidden" style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}>
                  <div className="h-full" style={{ width: `${readPercent}%`, background: "var(--kov-red)", transition: "width 0.2s linear" }} />
                </div>
                <p className="text-kov-bone text-sm mt-2 tabular-nums">{readPercent}% lu</p>
              </div>

              <div className="p-6" style={{ background: "var(--kov-black)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}>
                <p className="font-display text-kov-bone uppercase text-lg mb-3">
                  Un projet en tête<span className="text-kov-red">.</span>
                </p>
                <p className="text-kov-steel text-sm leading-relaxed mb-5">Discutons de votre prochaine étape.</p>
                <Button href="/contact" variant="primary" className="w-full justify-center">
                  Prendre rendez-vous
                </Button>
              </div>

              <div className="p-5 flex items-center justify-between gap-3" style={CARD_STYLE}>
                <div>
                  <p className="text-kov-bone text-sm tabular-nums">{article.views}</p>
                  <p className="text-kov-steel text-[10px] uppercase tracking-widest">Vues</p>
                </div>
                <div>
                  <p className="text-kov-bone text-sm tabular-nums">{article.likes}</p>
                  <p className="text-kov-steel text-[10px] uppercase tracking-widest">Likes</p>
                </div>
                {article.tag && (
                  <Link
                    href={`/journal?tag=${encodeURIComponent(article.tag)}`}
                    className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
                  >
                    {article.tag}
                  </Link>
                )}
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-32">
              <p className="text-xs uppercase tracking-widest text-kov-steel mb-8">À lire aussi</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((post) => (
                  <RelatedCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .kov-post-body { color: var(--kov-concrete); font-size: 1rem; line-height: 1.75; }
        .kov-post-body p { margin: 0 0 1.5rem; }
        .kov-post-body h2 { color: var(--kov-bone); font-family: var(--font-display, inherit); text-transform: uppercase; font-size: 1.5rem; margin: 2.5rem 0 1rem; scroll-margin-top: 96px; }
        .kov-post-body h3 { color: var(--kov-bone); font-family: var(--font-display, inherit); text-transform: uppercase; font-size: 1.15rem; margin: 2rem 0 0.75rem; scroll-margin-top: 96px; }
        .kov-post-body ul, .kov-post-body ol { margin: 0 0 1.5rem; padding-left: 1.5rem; }
        .kov-post-body li { margin-bottom: 0.5rem; }
        .kov-post-body blockquote { border-left: 2px solid var(--kov-red); padding-left: 1.25rem; margin: 2rem 0; color: var(--kov-bone); font-style: italic; }
        .kov-post-body a { color: var(--kov-red); text-decoration: underline; text-underline-offset: 2px; }
        .kov-post-body img { max-width: 100%; height: auto; border-radius: var(--radius-sm); }
        .kov-post-body strong { color: var(--kov-bone); }
      `}</style>
    </main>
  );
}

function RelatedCard({ post }: { post: JournalPostSummary }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block overflow-hidden" style={CARD_STYLE}>
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--kov-graphite)" }} />
        )}
      </div>
      <div className="p-5">
        <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
          {formatDate(post.publishedAt)}
          {post.readingTime && ` — ${post.readingTime}`}
        </p>
        <h4
          className="text-kov-bone text-base mb-2 group-hover:text-kov-red transition-colors"
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {post.title}
        </h4>
        <ArrowRight size={14} className="text-kov-red" />
      </div>
    </Link>
  );
}
