import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";
import { Button } from "@/components/ui/Button";
import { FolderIcon } from "@/lib/documentIcons";
import { DocumentGrid, type DocumentGridItem } from "@/components/documents/DocumentGrid";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import { createDocumentFolder, uploadProjectDocument, getDocumentPreviewUrl, downloadProjectDocument } from "./actions";

export const metadata: Metadata = {
  title: "Projet — Admin KOV",
};

const FIELD_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

async function getBreadcrumb(folderId: string | null) {
  const crumbs: { id: string; name: string }[] = [];
  let currentId = folderId;
  while (currentId) {
    const { data } = await supabaseAdmin
      .from("document_folders")
      .select("id, name, parent_folder_id")
      .eq("id", currentId)
      .maybeSingle();
    if (!data) break;
    crumbs.unshift({ id: data.id, name: data.name });
    currentId = data.parent_folder_id;
  }
  return crumbs;
}

export default async function AdminProjectDetailPage(props: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id: projectId } = await props.params;
  const searchParams = await props.searchParams;
  const folderParam = searchParams.folder;
  const currentFolderId = typeof folderParam === "string" && folderParam ? folderParam : null;

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, client_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) notFound();

  const { data: client } = await supabaseAdmin
    .from("profiles")
    .select("full_name, company, email")
    .eq("id", project.client_id)
    .maybeSingle();

  const breadcrumb = await getBreadcrumb(currentFolderId);

  const folderFilter = currentFolderId
    ? supabaseAdmin.from("document_folders").select("id, name").eq("project_id", projectId).eq("parent_folder_id", currentFolderId)
    : supabaseAdmin.from("document_folders").select("id, name").eq("project_id", projectId).is("parent_folder_id", null);

  const documentFilter = currentFolderId
    ? supabaseAdmin
        .from("documents")
        .select("id, filename, mime_type, size_bytes, created_at, storage_path")
        .eq("project_id", projectId)
        .eq("folder_id", currentFolderId)
    : supabaseAdmin
        .from("documents")
        .select("id, filename, mime_type, size_bytes, created_at, storage_path")
        .eq("project_id", projectId)
        .is("folder_id", null);

  const [{ data: folders }, { data: documents }] = await Promise.all([
    folderFilter.order("name"),
    documentFilter.order("created_at", { ascending: false }),
  ]);

  const folderRows = folders ?? [];
  const documentRows = documents ?? [];

  const gridItems: DocumentGridItem[] = await Promise.all(
    documentRows.map(async (doc) => {
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
    })
  );

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-10">
      <div>
        <Link href={`/admin/clients/${project.client_id}`} className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← {client?.full_name || client?.company || client?.email}
        </Link>
        <div className="flex items-center gap-4 mt-4">
          <h1 className="font-display text-kov-bone text-2xl uppercase">{project.name}</h1>
          <span className="text-kov-steel text-xs uppercase tracking-widest">
            {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
          </span>
        </div>
        <p className="text-kov-steel text-sm mt-1">{project.category}</p>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Documents (GED)</h2>

        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link href={`/admin/projects/${projectId}`} className="text-kov-steel hover:text-kov-red transition-colors">
            Racine
          </Link>
          {breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-kov-steel">/</span>
              <Link href={`/admin/projects/${projectId}?folder=${crumb.id}`} className="text-kov-steel hover:text-kov-red transition-colors">
                {crumb.name}
              </Link>
            </span>
          ))}
        </div>

        {folderRows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {folderRows.map((folder) => (
              <Link
                key={folder.id}
                href={`/admin/projects/${projectId}?folder=${folder.id}`}
                className="border p-4 flex flex-col items-center gap-2 hover:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              >
                <FolderIcon className="w-8 h-8 text-kov-steel" />
                <p className="text-kov-bone text-xs text-center truncate w-full">{folder.name}</p>
              </Link>
            ))}
          </div>
        )}

        <DocumentGrid documents={gridItems} getPreviewUrl={getDocumentPreviewUrl} downloadAction={downloadProjectDocument} />

        <div className="flex flex-wrap gap-4 mt-8">
          <form action={createDocumentFolder} className="border p-4 flex items-end gap-3" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="parent_folder_id" value={currentFolderId ?? ""} />
            <label className="text-xs text-kov-steel">
              Nouveau dossier
              <input type="text" name="name" required placeholder="Contrats" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
            </label>
            <Button type="submit" variant="secondary">
              Créer
            </Button>
          </form>

          <form action={uploadProjectDocument} className="border p-4 flex items-end gap-3" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="folder_id" value={currentFolderId ?? ""} />
            <label className="text-xs text-kov-steel">
              Ajouter un fichier {breadcrumb.length > 0 ? `dans « ${breadcrumb[breadcrumb.length - 1].name} »` : "à la racine"}
              <input type="file" name="file" required className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
            </label>
            <Button type="submit" variant="primary">
              Téléverser
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
