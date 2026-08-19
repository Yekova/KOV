import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { downloadDocument } from "./actions";

export const metadata: Metadata = {
  title: "Documents — KOV",
};

export default async function ClientDocumentsPage() {
  const user = await requireUser();

  const { data: documents } = await supabaseAdmin
    .from("documents")
    .select("id, filename, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const rows = documents ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Documents</h1>

      <GlassCard className="p-6">
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm">Aucun document pour l&apos;instant.</p>
        ) : (
          <ul>
            {rows.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <div className="min-w-0">
                  <p className="text-kov-bone text-sm truncate">{doc.filename}</p>
                  <p className="text-kov-steel text-xs mt-1">
                    {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <form action={downloadDocument}>
                  <input type="hidden" name="document_id" value={doc.id} />
                  <Button type="submit" variant="ghost">
                    Télécharger →
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
