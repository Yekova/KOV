import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";
import { Button } from "@/components/ui/Button";
import { DocumentGrid, type DocumentGridItem } from "@/components/documents/DocumentGrid";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import {
  createDocumentFolder,
  uploadProjectDocument,
  getDocumentPreviewUrl,
  downloadProjectDocument,
  deleteProjectDocument,
} from "./actions";
import { FolderCard } from "./FolderCard";
import { ProjectPhasesPanel } from "@/components/admin/projects/ProjectPhasesPanel";
import { ProjectTasksPanel } from "@/components/admin/projects/ProjectTasksPanel";
import type { PickerOption, TaskRow } from "@/components/admin/tasks/types";

const TABS = [
  { id: "documents", label: "Documents" },
  { id: "tasks", label: "Tâches" },
  { id: "phases", label: "Phases" },
] as const;

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
  const tabParam = searchParams.tab;
  const tab = tabParam === "tasks" ? "tasks" : tabParam === "phases" ? "phases" : "documents";

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

  const [{ data: tasks }, { data: phases }, { data: admins }] = await Promise.all([
    supabaseAdmin
      .from("project_tasks")
      .select(
        "id, title, description, status, priority, due_date, project_id, assigned_to, phase_id, position, created_at, updated_at, validation_status"
      )
      .eq("project_id", projectId)
      .order("position"),
    supabaseAdmin.from("project_phases").select("id, project_id, name, status, position").eq("project_id", projectId).order("position"),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").is("archived_at", null).order("full_name"),
  ]);

  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: checklistItems } = taskIds.length
    ? await supabaseAdmin.from("task_checklist_items").select("task_id, is_done").in("task_id", taskIds)
    : { data: [] as { task_id: string; is_done: boolean }[] };

  const adminNameById = new Map((admins ?? []).map((a) => [a.id, a.full_name || a.email]));
  const phaseNameById = new Map((phases ?? []).map((p) => [p.id, p.name]));
  const checklistByTask = new Map<string, { done: number; total: number }>();
  for (const item of checklistItems ?? []) {
    const entry = checklistByTask.get(item.task_id) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (item.is_done) entry.done += 1;
    checklistByTask.set(item.task_id, entry);
  }

  const taskRows: TaskRow[] = (tasks ?? []).map((t) => {
    const checklist = checklistByTask.get(t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      projectId: t.project_id,
      projectName: project.name,
      assignedTo: t.assigned_to,
      assigneeName: t.assigned_to ? adminNameById.get(t.assigned_to) ?? null : null,
      phaseId: t.phase_id,
      phaseName: t.phase_id ? phaseNameById.get(t.phase_id) ?? null : null,
      position: t.position,
      checklistDone: checklist?.done ?? 0,
      checklistTotal: checklist?.total ?? 0,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      validationStatus: t.validation_status,
    };
  });

  const adminOptions: PickerOption[] = (admins ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));
  const phaseOptions: PickerOption[] = (phases ?? []).map((p) => ({ id: p.id, label: p.name }));
  const phaseRows = (phases ?? []).map((p) => ({ id: p.id, name: p.name, status: p.status }));

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

      <div className="flex items-center gap-6 border-b" style={{ borderColor: "var(--kov-border)" }}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "documents" ? `/admin/projects/${projectId}` : `/admin/projects/${projectId}?tab=${t.id}`}
            className="text-xs uppercase tracking-widest pb-3 transition-colors"
            style={{
              color: tab === t.id ? "var(--kov-red)" : "var(--kov-steel)",
              borderBottom: tab === t.id ? "2px solid var(--kov-red)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "tasks" && (
        <section>
          <ProjectTasksPanel projectId={projectId} tasks={taskRows} admins={adminOptions} phases={phaseOptions} />
        </section>
      )}

      {tab === "phases" && (
        <section>
          <ProjectPhasesPanel projectId={projectId} phases={phaseRows} />
        </section>
      )}

      {tab === "documents" && (
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
              <FolderCard key={folder.id} projectId={projectId} folderId={folder.id} name={folder.name} />
            ))}
          </div>
        )}

        <DocumentGrid
          documents={gridItems}
          getPreviewUrl={getDocumentPreviewUrl}
          downloadAction={downloadProjectDocument}
          onDelete={deleteProjectDocument}
        />

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
      )}
    </main>
  );
}
