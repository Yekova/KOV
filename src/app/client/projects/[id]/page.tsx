import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";
import { GlassCard } from "@/components/ui/GlassCard";
import { FolderIcon } from "@/lib/documentIcons";
import { DocumentGrid, type DocumentGridItem } from "@/components/documents/DocumentGrid";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import { getClientDocumentPreviewUrl, downloadDocument } from "@/app/client/documents/actions";

export const metadata: Metadata = {
  title: "Projet — KOV",
};

async function getBreadcrumb(folderId: string | null, projectId: string) {
  const crumbs: { id: string; name: string }[] = [];
  let currentId = folderId;
  while (currentId) {
    const { data } = await supabaseAdmin
      .from("document_folders")
      .select("id, name, parent_folder_id")
      .eq("id", currentId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (!data) break;
    crumbs.unshift({ id: data.id, name: data.name });
    currentId = data.parent_folder_id;
  }
  return crumbs;
}

export default async function ClientProjectDetailPage(props: PageProps<"/client/projects/[id]">) {
  const user = await requireUser();
  const { id: projectId } = await props.params;
  const searchParams = await props.searchParams;
  const folderParam = searchParams.folder;
  const currentFolderId = typeof folderParam === "string" && folderParam ? folderParam : null;

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, client_id, progress_percent")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.client_id !== user.id) notFound();

  const breadcrumb = await getBreadcrumb(currentFolderId, projectId);

  const folderFilter = currentFolderId
    ? supabaseAdmin.from("document_folders").select("id, name").eq("project_id", projectId).eq("parent_folder_id", currentFolderId)
    : supabaseAdmin.from("document_folders").select("id, name").eq("project_id", projectId).is("parent_folder_id", null);

  const documentFilter = currentFolderId
    ? supabaseAdmin
        .from("documents")
        .select("id, filename, mime_type, size_bytes, created_at, storage_path")
        .eq("project_id", projectId)
        .eq("folder_id", currentFolderId)
        .eq("visibility", "client")
    : supabaseAdmin
        .from("documents")
        .select("id, filename, mime_type, size_bytes, created_at, storage_path")
        .eq("project_id", projectId)
        .is("folder_id", null)
        .eq("visibility", "client");

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
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full space-y-10">
      <div>
        <Link href="/client/projects" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Mes projets
        </Link>
        <div className="flex items-center gap-4 mt-4">
          <h1 className="font-display text-kov-bone text-2xl uppercase">{project.name}</h1>
          <span className="text-kov-red text-xs uppercase tracking-widest">
            {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
          </span>
        </div>
        <p className="text-kov-steel text-sm mt-1">{project.category}</p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Documents</h2>

        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link href={`/client/projects/${projectId}`} className="text-kov-steel hover:text-kov-red transition-colors">
            Racine
          </Link>
          {breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-kov-steel">/</span>
              <Link href={`/client/projects/${projectId}?folder=${crumb.id}`} className="text-kov-steel hover:text-kov-red transition-colors">
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
                href={`/client/projects/${projectId}?folder=${folder.id}`}
                className="border p-4 flex flex-col items-center gap-2 hover:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              >
                <FolderIcon className="w-8 h-8 text-kov-steel" />
                <p className="text-kov-bone text-xs text-center truncate w-full">{folder.name}</p>
              </Link>
            ))}
          </div>
        )}

        <DocumentGrid
          documents={gridItems}
          getPreviewUrl={getClientDocumentPreviewUrl}
          downloadAction={downloadDocument}
        />
      </GlassCard>
    </main>
  );
}
