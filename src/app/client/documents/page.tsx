import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrls } from "@/lib/portal/storage";
import { GlassCard } from "@/components/ui/GlassCard";
import { DocumentGrid, type DocumentGridItem } from "@/components/documents/DocumentGrid";
import { getClientDocumentPreviewUrl, downloadDocument } from "./actions";
import { UploadDocumentForm } from "./UploadDocumentForm";

export const metadata: Metadata = {
  title: "Documents — KOV",
};

export default async function ClientDocumentsPage() {
  const user = await requireUser();

  const [{ data: documents }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from("documents")
      .select("id, filename, mime_type, size_bytes, created_at, storage_path, project_id")
      .eq("client_id", user.id)
      .eq("visibility", "client")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("projects").select("id, name").eq("client_id", user.id),
  ]);

  const rows = documents ?? [];
  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  // Une signature pour toutes les vignettes, pas une par image : la page
  // faisait un aller-retour Storage par document image à chaque affichage.
  const thumbnailUrls = await createSignedDownloadUrls(
    rows.filter((doc) => doc.mime_type?.startsWith("image/")).map((doc) => doc.storage_path),
    600
  );

  const toGridItem = (doc: (typeof rows)[number]): DocumentGridItem => ({
    id: doc.id,
    filename: doc.filename,
    mimeType: doc.mime_type,
    sizeBytes: doc.size_bytes,
    createdAt: doc.created_at,
    thumbnailUrl: thumbnailUrls.get(doc.storage_path) ?? null,
  });

  const byProject = new Map<string | null, (typeof rows)[number][]>();
  for (const doc of rows) {
    const key = doc.project_id;
    byProject.set(key, [...(byProject.get(key) ?? []), doc]);
  }

  const groups = Array.from(byProject.entries()).map(([projectId, docs]) => ({
    label: projectId ? projectNameById.get(projectId) ?? "Projet" : "Général",
    items: docs.map(toGridItem),
  }));

  const projectRows = projects ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Documents</h1>

      <GlassCard className="p-6" variant="solid">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Envoyer un document</p>
        <UploadDocumentForm projects={projectRows} />
      </GlassCard>

      {rows.length === 0 ? (
        <GlassCard className="p-6">
          <p className="text-kov-steel text-sm">Aucun document pour l&apos;instant.</p>
        </GlassCard>
      ) : (
        groups.map((group) => (
          <GlassCard key={group.label} className="p-6">
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">{group.label}</p>
            <DocumentGrid documents={group.items} getPreviewUrl={getClientDocumentPreviewUrl} downloadAction={downloadDocument} />
          </GlassCard>
        ))
      )}
    </main>
  );
}
