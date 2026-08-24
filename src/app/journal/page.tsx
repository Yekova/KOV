import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";

export const metadata: Metadata = {
  title: "Journal — KOV",
  description: "Études de cas et notes de studio — comment on construit ce dont on est fiers.",
  alternates: { canonical: "https://kov-agency.site/journal" },
};

export default async function JournalPage() {
  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select("id, slug, title, excerpt, cover_image_path, client_display_name, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const rows = posts ?? [];

  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Journal</p>
      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Études de cas et notes de studio<span className="text-kov-red">.</span>
      </h1>

      {rows.length === 0 ? (
        <p className="mt-16 text-kov-concrete text-sm">Rien à lire pour l&apos;instant — revenez bientôt.</p>
      ) : (
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 border-t pt-16" style={{ borderColor: "var(--kov-border)" }}>
          {rows.map((post) => {
            const coverUrl = getPublicAssetUrl(post.cover_image_path);
            return (
              <Link key={post.id} href={`/journal/${post.slug}`} className="group block">
                <div
                  className="aspect-[4/3] w-full mb-5 overflow-hidden"
                  style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
                >
                  {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                {post.client_display_name && (
                  <p className="text-kov-red text-xs uppercase tracking-widest mb-2">{post.client_display_name}</p>
                )}
                <h2 className="font-display text-kov-bone uppercase text-xl mb-2 group-hover:text-kov-red transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-kov-concrete text-sm leading-relaxed">{post.excerpt}</p>}
                {post.published_at && (
                  <p className="text-kov-steel text-xs uppercase tracking-widest mt-4">
                    {new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
