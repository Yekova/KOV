import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PostForm } from "../PostForm";

export const metadata: Metadata = { title: "Modifier l'article — Admin KOV" };

export default async function EditPostPage(props: PageProps<"/admin/content/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const { data: projects } = await supabaseAdmin.from("projects").select("id, name").order("name");
  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name }));

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-4">
      <div className="flex justify-end">
        <Link
          href={`/journal/preview/${id}`}
          target="_blank"
          className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors"
        >
          Aperçu →
        </Link>
      </div>
      <PostForm postId={id} projects={projectOptions} />
    </main>
  );
}
