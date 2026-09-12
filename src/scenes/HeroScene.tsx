import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { HeroWidgetGrid } from "@/components/home/HeroWidgetGrid";
import type { HeroJournalPost } from "@/components/home/hero-widgets/JournalContent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePostImageUrl } from "@/lib/portal/storage";

async function getLatestJournalPost(): Promise<HeroJournalPost | null> {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("slug, title, tag, excerpt, cover_image_path, published_at, reading_time")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    slug: data.slug,
    title: data.title,
    tag: data.tag,
    excerpt: data.excerpt,
    coverUrl: resolvePostImageUrl(data.cover_image_path),
    publishedAt: data.published_at,
    readingTime: data.reading_time,
  };
}

export async function HeroScene() {
  const latestPost = await getLatestJournalPost();
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      {/* No background color here on purpose — the animated LineWaves
          background now lives at the page level (src/app/page.tsx) so
          it's visible behind every homepage section, not just this one.
          An opaque background on this section would hide it completely
          for this section's entire height (the whole first viewport). */}

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex items-center px-6 md:px-16 pt-24 md:pt-28 pb-16"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-8 items-center w-full max-w-[1600px] mx-auto">
          <div>
            <p className="flex items-center gap-2 text-kov-steel text-xs uppercase tracking-widest">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
              Digital × Design × Motion
            </p>

            <h1
              className="mt-4 font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(24px, 3.5vw, 56px)", lineHeight: "var(--line-height-display)" }}
            >
              UNE VISION.
              <br />
              UNE EXÉCUTION<span className="text-kov-red">.</span>
            </h1>

            <p className="mt-8 max-w-md text-kov-concrete text-sm leading-relaxed">
              De la conception au motion, un seul studio pour maîtriser l&apos;exigence de chaque pixel.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <KovCTA href="/contact" flat emphasis>
                Démarrer un projet
              </KovCTA>
              <KovCTA href="/#work-gallery" flat>
                Voir nos projets
              </KovCTA>
            </div>
          </div>

          {/* The old video + stacked-photos composition is gone entirely —
              replaced by a 7-widget modular, draggable bento grid (see
              HeroWidgetGrid.tsx and its own §-referenced comments for the
              full reasoning: fixed sizes, native HTML5 drag-and-drop off a
              dedicated handle, framer-motion `layout` for the reflow,
              localStorage persistence). The responsive-mockup footage
              lives inside the grid now too, as the "Responsive Preview"
              widget's own content. */}
          <HeroWidgetGrid latestPost={latestPost} />
        </div>
      </div>

      {/* Wrapped in its own h-screen box, pinned to the section's top,
          rather than a bare <HeroGlobalMenuButton /> as a direct child —
          the button's own `bottom-*` resolves against its nearest
          positioned ancestor, and this section is `min-h-screen`: if the
          content above (the image/video stack) ever pushes the section
          taller than one real viewport, `bottom-*` against the section
          itself would land below the visible fold, not at the bottom of
          what's actually on screen. `position:absolute` (not sticky/fixed)
          on this wrapper doesn't create its own stacking context, so it
          doesn't trap the button's z-index either. */}
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none">
        <div className="pointer-events-auto">
          <HeroGlobalMenuButton />
        </div>
      </div>
    </section>
  );
}
