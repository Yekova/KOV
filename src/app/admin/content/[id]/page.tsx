import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PostForm } from "../PostForm";

export const metadata: Metadata = { title: "Modifier l'article — Admin KOV" };

export default async function EditPostPage(props: PageProps<"/admin/content/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const [{ data: post }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from("posts")
      .select("id, title, slug, excerpt, body, client_display_name, project_id, status, cover_image_path")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin.from("projects").select("id, name").order("name"),
  ]);

  if (!post) notFound();

  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name }));

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Modifier l&apos;article</h1>
      <PostForm
        projects={projectOptions}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          clientDisplayName: post.client_display_name,
          projectId: post.project_id,
          status: post.status as "draft" | "published",
          coverImageUrl: getPublicAssetUrl(post.cover_image_path),
        }}
      />
    </main>
  );
}
