import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PostForm } from "../PostForm";

export const metadata: Metadata = { title: "Nouvel article — Admin KOV" };

export default async function NewPostPage() {
  await requireAdmin();

  const { data: projects } = await supabaseAdmin.from("projects").select("id, name").order("name");
  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name }));

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Nouvel article</h1>
      <PostForm projects={projectOptions} />
    </main>
  );
}
