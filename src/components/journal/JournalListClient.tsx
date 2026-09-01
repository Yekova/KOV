"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, LayoutGrid, Zap, BookOpen, Clock, Tags, CalendarClock, ArrowRight } from "lucide-react";
import MagicRings from "./MagicRingsLazy";
import { NewsletterSection } from "./NewsletterSection";
import { JournalCta } from "./JournalCta";
import type { JournalPostSummary } from "./journalTypes";

type TabKey = "featured" | "themes" | "brief";

const TABS: { key: TabKey; label: string; icon: typeof Star }[] = [
  { key: "featured", label: "À la une", icon: Star },
  { key: "themes", label: "Par thèmes", icon: LayoutGrid },
  { key: "brief", label: "En bref", icon: Zap },
];

const GLASS_CARD_STYLE = {
  background: "linear-gradient(135deg, hsl(0 0% 100% / 0.06) 0%, hsl(0 0% 100% / 0.02) 100%)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid hsl(0 0% 100% / 0.08)",
  boxShadow: "0 4px 24px -4px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
  borderRadius: 18,
} as const;

function parseReadingMinutes(readingTime: string | null): number {
  if (!readingTime) return 0;
  const match = readingTime.match(/(\d+)\s*(min|h)/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  return match[2] === "h" ? value * 60 : value;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function JournalListClient({ posts }: { posts: JournalPostSummary[] }) {
  const [tab, setTab] = useState<TabKey>("featured");
  const [category, setCategory] = useState<string>("Tous");

  const featuredArticle = posts.find((p) => p.featured) ?? posts[0] ?? null;
  const others = posts.filter((p) => p.id !== featuredArticle?.id);

  const categories = useMemo(() => {
    const set = new Set(others.map((p) => p.tag).filter((t): t is string => !!t));
    return ["Tous", ...Array.from(set).sort()];
  }, [others]);

  const filtered = category === "Tous" ? others : others.filter((p) => p.tag === category);

  const stats = useMemo(() => {
    const totalMinutes = posts.reduce((sum, p) => sum + parseReadingMinutes(p.readingTime), 0);
    const avgMinutes = posts.length > 0 ? Math.round(totalMinutes / posts.length) : 0;
    const themeCount = new Set(posts.map((p) => p.tag).filter(Boolean)).size;
    const latest = posts.reduce<string | null>(
      (acc, p) => (!acc || (p.publishedAt && p.publishedAt > acc) ? p.publishedAt : acc),
      null
    );
    return { count: posts.length, avgMinutes, themeCount, latest };
  }, [posts]);

  if (posts.length === 0) {
    return (
      <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Journal</p>
        <h1 className="font-display text-kov-bone uppercase max-w-4xl" style={{ fontSize: "var(--display-lg)" }}>
          Études de cas et notes de studio<span className="text-kov-red">.</span>
        </h1>
        <p className="mt-16 text-kov-concrete text-sm">Rien à lire pour l&apos;instant — revenez bientôt.</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-6 pt-40 pb-24 overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-80">
          <MagicRings
            color="#e31e24"
            colorTwo="#ff4d4d"
            ringCount={5}
            opacity={0.35}
            followMouse
            mouseInfluence={0.15}
            parallax={0.04}
            blur={0}
            clickBurst
            alphaMode="luminance"
          />
        </div>

        <div className="relative max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4">
            <span
              className="inline-block text-[10px] uppercase tracking-widest px-3 py-1.5 mb-6 text-kov-red border"
              style={{ borderColor: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
            >
              Actualités &amp; Décryptages
            </span>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
            >
              Études de cas et notes de studio<span className="text-kov-red">.</span>
            </motion.h1>
            <p className="text-kov-concrete text-sm leading-relaxed mt-6 max-w-sm">
              Ce qu&apos;on apprend en construisant — méthode, choix techniques et retours d&apos;expérience, sans filtre marketing.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-10">
              <Stat icon={BookOpen} value={String(stats.count)} label={stats.count > 1 ? "articles" : "article"} />
              <Stat icon={Clock} value={`${stats.avgMinutes} min`} label="lecture moyenne" />
              <Stat icon={Tags} value={String(stats.themeCount)} label={stats.themeCount > 1 ? "thèmes" : "thème"} />
              <Stat icon={CalendarClock} value={formatDate(stats.latest) || "—"} label="dernière publication" />
            </div>
          </div>

          <div className="lg:col-span-8">{featuredArticle && <FeaturedHeroCard post={featuredArticle} />}</div>
        </div>
      </section>

      {/* ── Sticky tabs + filters ────────────────────────────── */}
      <div
        className="sticky z-20 px-6 py-4"
        style={{
          top: 72,
          background: "hsl(0 0% 4% / 0.75)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          borderBottom: "1px solid var(--kov-border)",
        }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex items-center gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className="relative flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-colors"
                  style={{ color: active ? "var(--kov-white)" : "var(--kov-steel)", borderRadius: "var(--radius-pill)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-bubble"
                      className="absolute inset-0"
                      style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon size={14} strokeWidth={1.5} className="relative" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {tab !== "brief" && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 flex-wrap overflow-hidden"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="px-3 py-1.5 text-[11px] uppercase tracking-widest border whitespace-nowrap transition-colors"
                    style={{
                      borderRadius: "var(--radius-pill)",
                      borderColor: category === c ? "var(--kov-red)" : "var(--kov-border)",
                      color: category === c ? "var(--kov-red)" : "var(--kov-steel)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      <section className="px-6 py-16 max-w-[1600px] mx-auto">
        {tab === "featured" && <FeaturedTab items={filtered} />}
        {tab === "themes" && <ThemesTab items={filtered} />}
        {tab === "brief" && <BriefTab items={others.slice(0, 4)} />}
      </section>

      <NewsletterSection />
      <JournalCta />
    </main>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof BookOpen; value: string; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} strokeWidth={1.5} className="text-kov-red mt-0.5 shrink-0" />
      <div>
        <p className="text-kov-bone text-sm leading-tight">{value}</p>
        <p className="text-kov-steel text-[11px] uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FeaturedHeroCard({ post }: { post: JournalPostSummary }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group relative block overflow-hidden" style={{ height: 520, borderRadius: 18 }}>
      {post.coverUrl ? (
        <Image
          src={post.coverUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          priority
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--kov-graphite)" }} />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.35) 55%, transparent 100%)" }} />

      <div className="absolute top-5 left-5 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 text-kov-white" style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}>
          À la une
        </span>
        {post.tag && (
          <span
            className="text-[10px] uppercase tracking-widest px-2.5 py-1 text-kov-bone"
            style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-sm)" }}
          >
            {post.tag}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8">
        <h2 className="font-display text-kov-white uppercase text-2xl md:text-3xl mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-white/70 text-sm leading-relaxed mb-5 max-w-xl" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-xs uppercase tracking-widest">
            {formatDate(post.publishedAt)}
            {post.readingTime && ` — ${post.readingTime}`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-kov-white text-xs uppercase tracking-widest group-hover:text-kov-red-signal transition-colors">
            Lire l&apos;article <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LargeCard({ post }: { post: JournalPostSummary }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block">
      <div className="relative overflow-hidden mb-4" style={{ aspectRatio: "16/9", borderRadius: 14 }}>
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--kov-graphite)" }} />
        )}
        {post.tag && (
          <span
            className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2.5 py-1 text-kov-bone"
            style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-sm)" }}
          >
            {post.tag}
          </span>
        )}
      </div>
      <p className="text-kov-steel text-xs uppercase tracking-widest mb-2">
        {formatDate(post.publishedAt)}
        {post.readingTime && ` — ${post.readingTime}`}
      </p>
      <h3 className="font-display text-kov-bone uppercase text-xl mb-2 group-hover:text-kov-red transition-colors">{post.title}</h3>
      {post.excerpt && (
        <p className="text-kov-concrete text-sm leading-relaxed mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.excerpt}
        </p>
      )}
      <span className="inline-flex items-center gap-1.5 text-kov-red text-xs uppercase tracking-widest">
        Lire <ArrowRight size={13} />
      </span>
    </Link>
  );
}

function CompactCard({ post }: { post: JournalPostSummary }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group flex gap-4">
      <div className="relative shrink-0 overflow-hidden" style={{ width: 128, height: 96, borderRadius: 10 }}>
        {post.coverUrl ? (
          <Image src={post.coverUrl} alt="" fill sizes="128px" className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--kov-graphite)" }} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-1.5">
          {post.tag && `${post.tag} — `}
          {post.readingTime}
        </p>
        <h4
          className="text-kov-bone text-sm leading-snug group-hover:text-kov-red transition-colors"
          style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {post.title}
        </h4>
      </div>
    </Link>
  );
}

function GridCard({ post, index }: { post: JournalPostSummary; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/journal/${post.slug}`} className="group block overflow-hidden" style={GLASS_CARD_STYLE}>
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
          {post.coverUrl ? (
            <Image
              src={post.coverUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "var(--kov-graphite)" }} />
          )}
          {post.tag && (
            <span
              className="absolute top-3 left-3 text-[10px] uppercase tracking-widest px-2.5 py-1 text-kov-bone"
              style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-sm)" }}
            >
              {post.tag}
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
            {formatDate(post.publishedAt)}
            {post.readingTime && ` — ${post.readingTime}`}
          </p>
          <h4 className="text-kov-bone text-base mb-2 truncate group-hover:text-kov-red transition-colors">{post.title}</h4>
          {post.excerpt && (
            <p className="text-kov-concrete text-xs leading-relaxed mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.excerpt}
            </p>
          )}
          <ArrowRight size={14} className="text-kov-red" />
        </div>
      </Link>
    </motion.div>
  );
}

function BriefItem({ post }: { post: JournalPostSummary }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group flex items-start gap-4 py-5 border-b" style={{ borderColor: "var(--kov-border)" }}>
      <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}>
        <Zap size={15} strokeWidth={1.5} className="text-kov-red" />
      </span>
      <div className="min-w-0">
        <h4 className="text-kov-bone text-sm group-hover:text-kov-red transition-colors">{post.title}</h4>
        {post.excerpt && <p className="text-kov-steel text-xs mt-1 truncate">{post.excerpt}</p>}
        <p className="text-kov-steel text-[10px] uppercase tracking-widest mt-1.5">{formatDate(post.publishedAt)}</p>
      </div>
    </Link>
  );
}

function BrevesPanel({ items }: { items: JournalPostSummary[] }) {
  if (items.length === 0) return null;
  return (
    <div className="sticky p-6" style={{ top: 160, ...GLASS_CARD_STYLE }}>
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-5">En bref</p>
      <div className="space-y-5">
        {items.map((post) => (
          <Link key={post.id} href={`/journal/${post.slug}`} className="group flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center shrink-0" style={{ background: "var(--kov-carbon)", borderRadius: "var(--radius-sm)" }}>
              <Zap size={12} strokeWidth={1.5} className="text-kov-red" />
            </span>
            <div className="min-w-0">
              <p className="text-kov-bone text-xs leading-snug group-hover:text-kov-red transition-colors">{post.title}</p>
              {post.excerpt && <p className="text-kov-steel text-[11px] mt-1 truncate">{post.excerpt}</p>}
              <p className="text-kov-steel text-[10px] uppercase tracking-widest mt-1">{formatDate(post.publishedAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedTab({ items }: { items: JournalPostSummary[] }) {
  if (items.length === 0) return <p className="text-kov-steel text-sm">Aucun article dans cette catégorie.</p>;

  const [first, second, third, ...rest] = items;
  const pairs: JournalPostSummary[][] = [];
  const remaining = [second, third, ...rest].filter(Boolean) as JournalPostSummary[];
  for (let i = 0; i < remaining.length; i += 2) pairs.push(remaining.slice(i, i + 2));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-10">
        {first && <LargeCard post={first} />}
        {pairs.map((pair, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pair.map((post) => (
              <CompactCard key={post.id} post={post} />
            ))}
          </div>
        ))}
      </div>
      <div className="lg:col-span-4">
        <BrevesPanel items={items.slice(0, 4)} />
      </div>
    </div>
  );
}

function ThemesTab({ items }: { items: JournalPostSummary[] }) {
  if (items.length === 0) return <p className="text-kov-steel text-sm">Aucun article dans cette catégorie.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((post, i) => (
        <GridCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}

function BriefTab({ items }: { items: JournalPostSummary[] }) {
  if (items.length === 0) return <p className="text-kov-steel text-sm">Rien à afficher.</p>;
  return (
    <div className="max-w-2xl">
      {items.map((post) => (
        <BriefItem key={post.id} post={post} />
      ))}
    </div>
  );
}
