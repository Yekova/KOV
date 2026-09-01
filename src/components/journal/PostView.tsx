import Link from "next/link";

export interface PostViewData {
  title: string;
  body: string;
  coverUrl: string | null;
  clientDisplayName: string | null;
  publishedAt: string | null;
  tag?: string | null;
  readingTime?: string | null;
  audioUrl?: string | null;
}

// Shared by the public /journal/[slug] page and the admin draft-preview
// route (/admin/content/[id]/preview) so a draft previews pixel-for-pixel
// as what publishing it will actually look like — one template, one place
// to keep them in sync.
//
// `body` is HTML (TipTap-authored) — rendered via dangerouslySetInnerHTML
// with hand-written typographic CSS below (no @tailwindcss/typography
// plugin installed in this project). Older posts saved before the rich
// editor existed have a plain-text body — that's still valid HTML (bare
// text inside a container), it just won't have any rich formatting until
// re-edited.
export function PostView({ post, backHref, backLabel }: { post: PostViewData; backHref: string; backLabel: string }) {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32">
      <div className="max-w-3xl mx-auto">
        <Link href={backHref} className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors">
          {backLabel}
        </Link>

        <div className="flex items-center gap-3 mt-8 mb-3">
          {post.tag && <p className="text-kov-red text-xs uppercase tracking-widest">{post.tag}</p>}
          {post.clientDisplayName && <p className="text-kov-red text-xs uppercase tracking-widest">{post.clientDisplayName}</p>}
        </div>
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          {post.title}
        </h1>
        <div className="flex items-center gap-3 mt-4">
          {post.publishedAt && (
            <p className="text-kov-steel text-xs uppercase tracking-widest">
              {new Date(post.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {post.readingTime && <p className="text-kov-steel text-xs uppercase tracking-widest">— {post.readingTime}</p>}
        </div>

        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="w-full aspect-[16/9] object-cover mt-12" style={{ borderRadius: "var(--radius-md)" }} />
        )}

        {post.audioUrl && (
          <audio controls src={post.audioUrl} className="w-full mt-8" />
        )}

        <div className="kov-post-body mt-12 max-w-2xl" dangerouslySetInnerHTML={{ __html: post.body }} />

        <style>{`
          .kov-post-body { color: var(--kov-concrete); font-size: 1rem; line-height: 1.75; }
          .kov-post-body p { margin: 0 0 1.5rem; }
          .kov-post-body h2 { color: var(--kov-bone); font-family: var(--font-display, inherit); text-transform: uppercase; font-size: 1.5rem; margin: 2.5rem 0 1rem; }
          .kov-post-body h3 { color: var(--kov-bone); font-family: var(--font-display, inherit); text-transform: uppercase; font-size: 1.15rem; margin: 2rem 0 0.75rem; }
          .kov-post-body ul, .kov-post-body ol { margin: 0 0 1.5rem; padding-left: 1.5rem; }
          .kov-post-body li { margin-bottom: 0.5rem; }
          .kov-post-body blockquote { border-left: 2px solid var(--kov-red); padding-left: 1.25rem; margin: 2rem 0; color: var(--kov-bone); font-style: italic; }
          .kov-post-body a { color: var(--kov-red); text-decoration: underline; text-underline-offset: 2px; }
          .kov-post-body img { max-width: 100%; height: auto; border-radius: var(--radius-sm); }
          .kov-post-body strong { color: var(--kov-bone); }
        `}</style>
      </div>
    </main>
  );
}
