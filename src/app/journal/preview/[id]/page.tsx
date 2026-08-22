import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PostView } from "@/components/journal/PostView";

export const metadata: Metadata = { title: "Aperçu — KOV" };

// Deliberately outside /admin — that prefix gets the admin sidebar/topbar
// shell (src/app/admin/layout.tsx), which would make this look nothing like
// the real published page. Living here instead means SiteChrome wraps it
// with the actual public Nav + Footer, same as any real /journal/[slug]
// page, so what the admin sees here is what publishing will actually look
// like. Gated by requireAdmin() itself since there's no /admin route
// prefix to rely on for that.
export default async function PreviewPostPage(props: PageProps<"/journal/preview/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, body, cover_image_path, client_display_name, published_at, status")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="relative">
      {post.status === "draft" && (
        <div
          className="fixed top-0 inset-x-0 py-2 text-center text-xs uppercase tracking-widest text-kov-white"
          style={{ background: "var(--kov-red)", zIndex: "var(--z-modal)" }}
        >
          Aperçu — brouillon non publié
        </div>
      )}
      <PostView
        backHref={`/admin/content/${id}`}
        backLabel="← Retour à l'édition"
        post={{
          title: post.title,
          body: post.body,
          coverUrl: getPublicAssetUrl(post.cover_image_path),
          clientDisplayName: post.client_display_name,
          publishedAt: post.published_at,
        }}
      />
    </div>
  );
}
