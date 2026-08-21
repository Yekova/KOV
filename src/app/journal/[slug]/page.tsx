import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return { title: "Journal — KOV" };
  return { title: `${post.title} — KOV`, description: post.excerpt ?? undefined };
}

export default async function JournalPostPage(props: PageProps<"/journal/[slug]">) {
  const { slug } = await props.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, body, cover_image_path, client_display_name, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  const coverUrl = getPublicAssetUrl(post.cover_image_path);
  const body: string = post.body;
  const paragraphs = body.split(/\n\s*\n/).filter((p: string) => p.trim());

  return (
    <main className="min-h-screen px-6 pt-40 pb-32">
      <div className="max-w-3xl mx-auto">
        <Link href="/journal" className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors">
          ← Journal
        </Link>

        {post.client_display_name && (
          <p className="text-kov-red text-xs uppercase tracking-widest mt-8 mb-3">{post.client_display_name}</p>
        )}
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          {post.title}
        </h1>
        {post.published_at && (
          <p className="text-kov-steel text-xs uppercase tracking-widest mt-4">
            {new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="w-full aspect-[16/9] object-cover mt-12" style={{ borderRadius: "var(--radius-md)" }} />
        )}

        <div className="mt-12 space-y-6 max-w-2xl">
          {paragraphs.map((paragraph: string, index: number) => (
            <p key={index} className="text-kov-concrete text-base leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
