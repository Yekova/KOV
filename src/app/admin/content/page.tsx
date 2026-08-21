import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { DeletePostButton } from "./DeletePostButton";

export const metadata: Metadata = { title: "Contenu — Admin KOV" };

export default async function AdminContentPage() {
  await requireAdmin();

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  const rows = posts ?? [];

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Contenu</h1>
        <Button href="/admin/content/new" variant="primary">
          Nouvel article
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="Aucun article pour l'instant." />
      ) : (
        <div className="space-y-2">
          {rows.map((post) => (
            <div
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b py-3"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <div className="min-w-0">
                <Link href={`/admin/content/${post.id}`} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                  {post.title}
                </Link>
                <p className="text-kov-steel text-xs mt-1">/journal/{post.slug}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span
                  className="text-[10px] uppercase tracking-widest px-2 py-0.5"
                  style={{
                    color: post.status === "published" ? "var(--kov-red)" : "var(--kov-steel)",
                    background: post.status === "published" ? "rgba(220,38,38,0.1)" : "var(--kov-graphite)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {post.status === "published" ? "Publié" : "Brouillon"}
                </span>
                <Link href={`/admin/content/${post.id}`} className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors">
                  Modifier
                </Link>
                <DeletePostButton postId={post.id} title={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
