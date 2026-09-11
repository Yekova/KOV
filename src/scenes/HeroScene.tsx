import Image from "next/image";
import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { HeroClockCard } from "@/components/home/HeroClockCard";
import { HeroLineChartWidget } from "@/components/home/HeroLineChartWidget";
import { HeroJournalWidget, type HeroJournalWidgetPost } from "@/components/home/HeroJournalWidget";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Real KOV studio photography already shot for this site (used elsewhere —
// Expertise, the site-search panel) — no stock imagery, no placeholders.
// Only the top photo stays a photo now; the other two stack slots became
// dashboard-style widgets (see HeroChartWidget/HeroJournalWidget below).
const TOP_IMAGE = { image: "/kov/home/hero-character-studio.jpg", alt: "KOV Studio" };

async function getLatestJournalPost(): Promise<HeroJournalWidgetPost | null> {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("slug, title, tag, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { slug: data.slug, title: data.title, tag: data.tag, publishedAt: data.published_at };
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
            <h1
              className="font-display text-kov-bone uppercase"
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
              <KovCTA href="/contact">Démarrer un projet</KovCTA>
              <KovCTA href="/#work-gallery">Voir nos projets</KovCTA>
            </div>
          </div>

          {/* The real responsive-mockup footage (9:16, already shot for
              the homepage's Studio showcase) on the left. On the right, a
              small bento grid instead of three uniform stacked photos: the
              studio photo stays wide up top, then a row splitting into a
              narrower square-ish clock card next to a wider interactive
              line-chart card (two different shapes side by side, not
              another uniform rectangle), then the Journal preview wide
              again at the bottom. A fixed height on the outer row (rather
              than deriving it from the aspect-ratio boxes it contains) is
              what actually keeps both columns a real, non-collapsed size:
              neither an aspect-ratio box nor a `flex-1` column has any
              intrinsic height of its own to stretch against otherwise, and
              this exact bug (mutually-undefined sizes collapsing to ~0) is
              what made the video disappear entirely in an earlier pass. */}
          <div className="w-full flex items-stretch gap-3" style={{ height: "22rem" }}>
            <div className="relative h-full overflow-hidden" style={{ aspectRatio: "9 / 16", borderRadius: 18 }}>
              <video
                src="/home/responsive-mockup.mp4"
                poster="/home/responsive-mockup-poster.jpg"
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="h-full flex flex-col items-start gap-3">
              <div className="relative flex-1 w-full overflow-hidden" style={{ aspectRatio: "16 / 9", borderRadius: 18 }}>
                <Image src={TOP_IMAGE.image} alt={TOP_IMAGE.alt} fill sizes="220px" className="object-cover" />
              </div>
              <div className="flex-1 w-full flex items-stretch gap-3">
                <div className="h-full" style={{ width: "38%" }}>
                  <HeroClockCard />
                </div>
                <div className="h-full flex-1">
                  <HeroLineChartWidget />
                </div>
              </div>
              <div className="relative flex-1 w-full" style={{ aspectRatio: "16 / 9" }}>
                <HeroJournalWidget post={latestPost} />
              </div>
            </div>
          </div>
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
