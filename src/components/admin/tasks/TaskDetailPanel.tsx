"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Select } from "@/components/ui/Select";
import {
  getTaskDetail,
  updateTaskFields,
  deleteTask,
  type TaskDetail,
} from "@/app/admin/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  VALIDATION_STATUSES,
  VALIDATION_STATUS_LABELS,
} from "@/lib/admin/status";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";
import { TimeTrackingSection } from "./TimeTrackingSection";
import { AttachmentsSection } from "./AttachmentsSection";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

const SELECT_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none disabled:opacity-50";

export function TaskDetailPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [loadedTaskId, setLoadedTaskId] = useState(taskId);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");

  // Switching to a different task: drop the stale detail during render
  // (React's documented "adjusting state when a prop changes" pattern)
  // rather than in an effect, so the actual fetch below is the effect's
  // only job.
  if (taskId !== loadedTaskId) {
    setLoadedTaskId(taskId);
    setDetail(null);
    setError(null);
  }

  async function load() {
    try {
      const data = await getTaskDetail(taskId);
      setDetail(data);
      setTitleDraft(data.title);
      setDescriptionDraft(data.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    }
  }

  useEffect(() => {
    // Fetching this task's own detail on open (and again on switching to a
    // different task) is exactly what this effect is for — the data only
    // exists server-side, there's no synchronous alternative. load()'s own
    // setState calls only run after its internal await, never synchronously
    // within this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function applyPatch(patch: Parameters<typeof updateTaskFields>[1], optimistic: Partial<TaskDetail>) {
    if (!detail) return;
    setDetail({ ...detail, ...optimistic });
    setError(null);
    startTransition(async () => {
      try {
        await updateTaskFields(taskId, patch);
      } catch (err) {
        setError(err instanceof Error ? err.message : "La mise à jour a échoué.");
        load();
      }
    });
  }

  function handleDelete() {
    if (!detail) return;
    if (!window.confirm(`Supprimer la tâche « ${detail.title} » ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La suppression a échoué.");
      }
    });
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.6)" }}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-screen w-full sm:w-[480px] overflow-y-auto border-l"
        style={{
          zIndex: "var(--z-modal)",
          background: "var(--kov-black)",
          borderColor: "var(--glass-border)",
          boxShadow: "var(--glass-shadow-full)",
        }}
      >
        {!detail ? (
          <div className="p-6">
            <p className="text-kov-steel text-sm">{error ?? "Chargement…"}</p>
          </div>
        ) : (
          <div key={detail.id} className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-kov-steel text-xs uppercase tracking-widest truncate">{detail.projectName}</p>
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => {
                    if (titleDraft.trim() && titleDraft.trim() !== detail.title) {
                      applyPatch({ title: titleDraft }, { title: titleDraft.trim() });
                    } else {
                      setTitleDraft(detail.title);
                    }
                  }}
                  className="font-display text-kov-bone text-lg uppercase bg-transparent border-none focus:outline-none w-full mt-1"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="text-kov-steel hover:text-kov-red transition-colors shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {error && <p className="text-kov-red text-xs">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-kov-steel space-y-1">
                Statut
                <Select
                  value={detail.status}
                  disabled={isPending}
                  onChange={(value) => applyPatch({ status: value }, { status: value })}
                  options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
                  className={SELECT_CLASS}
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="text-xs text-kov-steel space-y-1">
                Priorité
                <Select
                  value={detail.priority ?? ""}
                  disabled={isPending}
                  placeholder="—"
                  onChange={(value) => applyPatch({ priority: value || null }, { priority: value || null })}
                  options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
                  className={SELECT_CLASS}
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="text-xs text-kov-steel space-y-1">
                Assigné à
                <Select
                  value={detail.assignedTo ?? ""}
                  disabled={isPending}
                  placeholder="Non assignée"
                  onChange={(value) => applyPatch({ assignedTo: value || null }, { assignedTo: value || null })}
                  options={detail.admins.map((a) => ({ value: a.id, label: a.label }))}
                  className={SELECT_CLASS}
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="text-xs text-kov-steel space-y-1">
                Phase
                <Select
                  value={detail.phaseId ?? ""}
                  disabled={isPending}
                  placeholder="Aucune"
                  onChange={(value) => applyPatch({ phaseId: value || null }, { phaseId: value || null })}
                  options={detail.phases.map((p) => ({ value: p.id, label: p.name }))}
                  className={SELECT_CLASS}
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                />
              </label>
              <label className="text-xs text-kov-steel space-y-1">
                Échéance
                <input
                  type="date"
                  defaultValue={detail.dueDate ?? ""}
                  disabled={isPending}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    applyPatch({ dueDate: e.target.value || null }, { dueDate: e.target.value || null })
                  }
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
              </label>
              <label className="text-xs text-kov-steel space-y-1">
                Estimation (min)
                <input
                  type="number"
                  min={0}
                  defaultValue={detail.estimatedMinutes ?? ""}
                  disabled={isPending}
                  onBlur={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    applyPatch({ estimatedMinutes: value }, { estimatedMinutes: value });
                  }}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
              </label>
            </div>

            <label className="text-xs text-kov-steel space-y-1 block">
              Validation
              <Select
                value={detail.validationStatus}
                disabled={isPending}
                onChange={(value) => applyPatch({ validationStatus: value }, { validationStatus: value })}
                options={VALIDATION_STATUSES.map((v) => ({ value: v, label: VALIDATION_STATUS_LABELS[v] }))}
                className={SELECT_CLASS}
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              />
            </label>

            <label className="text-xs text-kov-steel space-y-1 block">
              Description
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                onBlur={() => {
                  if (descriptionDraft !== (detail.description ?? "")) {
                    applyPatch(
                      { description: descriptionDraft.trim() || null },
                      { description: descriptionDraft.trim() || null }
                    );
                  }
                }}
                rows={3}
                placeholder="Aucune description"
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
            </label>

            <div className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
              <ChecklistSection taskId={taskId} items={detail.checklist} onChange={load} />
            </div>

            <div className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
              <TimeTrackingSection
                taskId={taskId}
                entries={detail.timeEntries}
                runningTimerId={detail.runningTimerId}
                estimatedMinutes={detail.estimatedMinutes}
                onChange={load}
              />
            </div>

            <div className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
              <AttachmentsSection taskId={taskId} attachments={detail.attachments} onChange={load} />
            </div>

            <div className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
              <CommentsSection taskId={taskId} comments={detail.comments} onChange={load} />
            </div>

            <div className="border-t pt-6" style={{ borderColor: "var(--kov-border)" }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="text-kov-red text-xs uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                Supprimer la tâche
              </button>
            </div>
          </div>
        )}
      </aside>
    </>,
    document.body
  );
}
