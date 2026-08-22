import Link from "next/link";

export interface PostViewData {
  title: string;
  body: string;
  coverUrl: string | null;
  clientDisplayName: string | null;
  publishedAt: string | null;
}

// Shared by the public /journal/[slug] page and the admin draft-preview
// route (/admin/content/[id]/preview) so a draft previews pixel-for-pixel
// as what publishing it will actually look like — one template, one place
// to keep them in sync.
export function PostView({ post, backHref, backLabel }: { post: PostViewData; backHref: string; backLabel: string }) {
  const paragraphs = post.body.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <main className="min-h-screen px-6 pt-40 pb-32">
      <div className="max-w-3xl mx-auto">
        <Link href={backHref} className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors">
          {backLabel}
        </Link>

        {post.clientDisplayName && (
          <p className="text-kov-red text-xs uppercase tracking-widest mt-8 mb-3">{post.clientDisplayName}</p>
        )}
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="text-kov-steel text-xs uppercase tracking-widest mt-4">
            {new Date(post.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="w-full aspect-[16/9] object-cover mt-12" style={{ borderRadius: "var(--radius-md)" }} />
        )}

        <div className="mt-12 space-y-6 max-w-2xl">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-kov-concrete text-base leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
