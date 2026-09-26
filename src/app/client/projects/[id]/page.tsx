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
import {
  PHASE_STATUS_LABELS,
  deriveCurrentPhase,
  deriveProgress,
  formatPhaseDates,
  type PhaseStatus,
  type ProjectPhase,
} from "@/lib/portal/progress";
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
    .select(
      "id, name, category, status, client_id, progress_percent, next_deadline_date, deadline_phase_label, project_phases(id, name, status, position, description, start_date, due_date)"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.client_id !== user.id) notFound();

  // Ce que le client voyait jusqu'ici de son projet : son nom, son statut,
  // et ses documents. Les phases existaient côté admin depuis le début et
  // ne traversaient jamais — c'est ce que cette page corrige.
  const phases = [...((project.project_phases ?? []) as ProjectPhase[])].sort((a, b) => a.position - b.position);
  const progress = deriveProgress(phases, project.progress_percent);
  const currentPhase = deriveCurrentPhase(phases, project.deadline_phase_label);

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
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-xs uppercase tracking-widest text-kov-steel">Avancement</h2>
          {currentPhase.label && (
            <p className="text-kov-steel text-xs">
              En cours :{" "}
              <span className="text-kov-bone">{currentPhase.label}</span>
              {currentPhase.status && currentPhase.status !== "in_progress" && (
                <span className="text-kov-steel"> — {PHASE_STATUS_LABELS[currentPhase.status]}</span>
              )}
            </p>
          )}
        </div>

        <div
          className="h-1.5 w-full overflow-hidden mb-2"
          style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
        >
          <div className="h-full" style={{ width: `${progress.percent}%`, background: "var(--kov-red)" }} />
        </div>
        <p className="text-kov-steel text-xs">
          {progress.percent}% complété
          {progress.total > 0 && (
            <span>
              {" "}
              — {progress.completed} phase{progress.completed > 1 ? "s" : ""} terminée
              {progress.completed > 1 ? "s" : ""} sur {progress.total}
            </span>
          )}
        </p>

        {/* Ce que le portail ne disait jamais : ce qu'on attend du client.
            Même « rien pour l'instant » est une information — sans elle, il
            ne sait pas s'il bloque le projet. */}
        <p className="text-kov-concrete text-sm mt-4 pt-4 border-t" style={{ borderColor: "var(--kov-border)" }}>
          {currentPhase.label
            ? currentPhase.status === "review"
              ? `« ${currentPhase.label} » attend votre relecture.`
              : `Nous travaillons sur « ${currentPhase.label} ». Aucune action attendue de votre part.`
            : phases.length > 0
              ? "Toutes les phases sont terminées."
              : "Aucune action attendue de votre part."}
        </p>

        {phases.length > 0 && (
          <ol className="mt-6 space-y-0">
            {phases.map((phase, index) => {
              const status = (phase.status as PhaseStatus) ?? "not_started";
              const done = status === "completed";
              const isCurrent = currentPhase.label === phase.name && !done;
              return (
                <li key={phase.id} className="flex gap-4">
                  {/* La colonne de gauche dessine le fil : une pastille par
                      phase, reliée à la suivante sauf pour la dernière. */}
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full mt-1.5"
                      style={{
                        background: done ? "var(--kov-red)" : isCurrent ? "var(--kov-bone)" : "var(--kov-border)",
                      }}
                    />
                    {index < phases.length - 1 && (
                      <span aria-hidden="true" className="w-px flex-1 my-1" style={{ background: "var(--kov-border)" }} />
                    )}
                  </div>
                  <div className="pb-5 min-w-0">
                    <p className="text-sm" style={{ color: done || isCurrent ? "var(--kov-bone)" : "var(--kov-steel)" }}>
                      {phase.name}
                    </p>
                    <p className="text-kov-steel text-xs mt-0.5">
                      {PHASE_STATUS_LABELS[status] ?? phase.status}
                      {/* Les dates ne s'affichent que renseignées : une
                          ligne « — » à chaque phase apprend à ne plus lire
                          la colonne. */}
                      {formatPhaseDates(phase.start_date, phase.due_date) && (
                        <span> · {formatPhaseDates(phase.start_date, phase.due_date)}</span>
                      )}
                    </p>
                    {phase.description && (
                      <p className="text-kov-steel text-xs mt-1 leading-relaxed">{phase.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </GlassCard>

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
