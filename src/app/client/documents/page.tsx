import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { DocumentGrid, type DocumentGridItem } from "@/components/documents/DocumentGrid";
import { getClientDocumentPreviewUrl, downloadDocument, uploadClientDocument } from "./actions";

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
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("projects").select("id, name").eq("client_id", user.id),
  ]);

  const rows = documents ?? [];
  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  const toGridItem = async (doc: (typeof rows)[number]): Promise<DocumentGridItem> => {
    const isImage = doc.mime_type?.startsWith("image/") ?? false;
    const thumbnailUrl = isImage ? await createSignedDownloadUrl(doc.storage_path, 600) : null;
    return {
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mime_type,
      sizeBytes: doc.size_bytes,
      createdAt: doc.created_at,
      thumbnailUrl,
    };
  };

  const byProject = new Map<string | null, (typeof rows)[number][]>();
  for (const doc of rows) {
    const key = doc.project_id;
    byProject.set(key, [...(byProject.get(key) ?? []), doc]);
  }

  const groups = await Promise.all(
    Array.from(byProject.entries()).map(async ([projectId, docs]) => ({
      label: projectId ? projectNameById.get(projectId) ?? "Projet" : "Général",
      items: await Promise.all(docs.map(toGridItem)),
    }))
  );

  const projectRows = projects ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Documents</h1>

      <GlassCard className="p-6" variant="solid">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Envoyer un document</p>
        <form action={uploadClientDocument} className="flex flex-wrap items-end gap-4">
          {projectRows.length > 0 && (
            <label className="text-xs text-kov-steel">
              Projet (facultatif)
              <select
                name="project_id"
                defaultValue=""
                className="block bg-transparent border px-3 py-2 mt-1 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                <option value="">Général</option>
                {projectRows.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-kov-steel">
            Fichier
            <input
              type="file"
              name="file"
              required
              className="block text-kov-bone text-sm mt-1 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-kov-red file:text-white"
            />
          </label>
          <Button type="submit" variant="primary">
            Envoyer
          </Button>
        </form>
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
