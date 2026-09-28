"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CheckSquare, Users } from "lucide-react";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { Select } from "@/components/ui/Select";
import { useState, useTransition } from "react";
import { updateProject } from "@/app/admin/clients/actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, isProjectStatus } from "@/lib/portal/status";
import { PROJECT_STATUS_COLORS } from "@/lib/admin/status";
import type { ProjectSummary } from "@/lib/admin/projects";

// La carte d'un projet.
//
// La liste des projets ne montrait pas l'avancement. C'était la colonne
// qu'on venait chercher, et il fallait ouvrir chaque fiche pour l'obtenir.
// Elle est ici, avec son origine : « 1 phase sur 7 » se vérifie, « 16 % »
// saisi à la main ne se vérifie pas, et l'écran doit dire lequel il montre.
//
// Les tâches sont comptées, jamais listées. C'est déjà la règle du portail
// client — elles portent un vocabulaire interne et des noms d'assignés — et
// une carte n'a de toute façon pas la place de les détailler.

function formatDeadline(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const [status, setStatus] = useState(project.status);
  const [pending, startTransition] = useTransition();
  const color = PROJECT_STATUS_COLORS[status] ?? "var(--kov-steel)";

  return (
    <article
      className="flex flex-col border transition-colors hover:border-kov-red overflow-hidden"
      style={{
        borderColor: "var(--kov-border)",
        borderRadius: "var(--radius-md, 10px)",
        background: "var(--kov-carbon)",
      }}
    >
      {/* La vignette n'occupe de la place que si elle existe. Un bloc gris
          « pas d'image » sur chaque carte volerait un tiers de la hauteur
          pour ne rien dire. */}
      {project.thumbnailUrl && (
        <div className="relative w-full aspect-[16/7]">
          <Image src={project.thumbnailUrl} alt="" fill sizes="400px" className="object-cover" />
        </div>
      )}

      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/projects/${project.id}`}
              className="block text-kov-bone text-sm truncate hover:text-kov-red transition-colors"
            >
              {project.name}
            </Link>
            <Link
              href={`/admin/clients/${project.clientId}`}
              className="flex items-center gap-1.5 mt-1 min-w-0 group"
            >
              <ClientAvatar name={project.clientName} avatarUrl={project.clientAvatarUrl} size={16} />
              <span className="text-kov-steel text-[11px] truncate group-hover:text-kov-red transition-colors">
                {project.clientName}
              </span>
            </Link>
          </div>

          <span
            className="px-2.5 py-1 text-[10px] uppercase tracking-widest whitespace-nowrap shrink-0"
            style={{ borderRadius: "var(--radius-pill)", border: `1px solid ${color}`, color }}
          >
            {isProjectStatus(status) ? PROJECT_STATUS_LABELS[status] : status}
          </span>
        </div>
      </div>

      {/* ── Avancement ────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="text-kov-concrete text-xs truncate">
            {project.currentPhaseName ?? "Phase non définie"}
          </span>
          <span className="text-kov-bone text-[11px] tabular-nums shrink-0">{project.progressPercent} %</span>
        </div>

        <div
          className="h-1 overflow-hidden"
          style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
        >
          <div className="h-full" style={{ width: `${project.progressPercent}%`, background: color }} />
        </div>

        <p className="text-kov-steel text-[10px] mt-1.5">
          {project.progressSource === "phases"
            ? `${project.phasesCompleted} phase${project.phasesCompleted > 1 ? "s" : ""} terminée${project.phasesCompleted > 1 ? "s" : ""} sur ${project.phasesTotal}`
            : "avancement saisi à la main, aucune phase définie"}
        </p>
      </div>

      {/* ── Ce qui tombe, ce qui reste ────────────────────────────────── */}
      <div className="px-4 py-3 border-t space-y-2 mt-auto" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-start gap-2.5">
          <CalendarDays size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 text-[11px] leading-snug">
            {project.nextDeadlineDate ? (
              <>
                <p className="text-kov-concrete truncate">
                  {project.nextDeadlineLabel?.trim() || "Prochaine échéance"}
                </p>
                <p style={{ color: project.deadlineOverdue ? "var(--kov-red)" : "var(--kov-steel)" }}>
                  {formatDeadline(project.nextDeadlineDate)}
                  {/* Le retard est écrit, pas seulement teinté. */}
                  {project.deadlineOverdue && " · dépassée"}
                </p>
              </>
            ) : (
              <p className="text-kov-steel">Aucune échéance renseignée</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CheckSquare size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 text-[11px] leading-snug flex-1">
            {project.tasksTotal === 0 ? (
              <p className="text-kov-steel">Aucune tâche</p>
            ) : (
              <>
                <p className="text-kov-concrete tabular-nums">
                  {project.tasksDone} tâche{project.tasksDone > 1 ? "s" : ""} sur {project.tasksTotal}
                </p>
                {(project.tasksOverdue > 0 || project.tasksAwaitingClient > 0) && (
                  <p className="text-kov-steel tabular-nums">
                    {project.tasksOverdue > 0 && (
                      <span style={{ color: "var(--kov-red)" }}>{project.tasksOverdue} en retard</span>
                    )}
                    {project.tasksOverdue > 0 && project.tasksAwaitingClient > 0 && " · "}
                    {/* Compté, jamais nommé : le titre d'une tâche en
                        validation est du vocabulaire interne. */}
                    {project.tasksAwaitingClient > 0 && `${project.tasksAwaitingClient} chez le client`}
                  </p>
                )}
              </>
            )}
          </div>

          {project.team.length > 0 && (
            <div className="flex items-center shrink-0" title={project.team.map((m) => m.name ?? "Sans nom").join(", ")}>
              <Users size={12} className="text-kov-steel mr-1.5" aria-hidden="true" />
              {project.team.slice(0, 3).map((member, index) => (
                <span
                  key={member.id}
                  className="rounded-full"
                  style={{ marginLeft: index === 0 ? 0 : -7, boxShadow: "0 0 0 2px var(--kov-carbon)" }}
                >
                  <ClientAvatar name={member.name} avatarUrl={member.avatarUrl} size={22} />
                </span>
              ))}
              {project.team.length > 3 && (
                <span className="text-kov-steel text-[10px] ml-1.5 tabular-nums">+{project.team.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Changer le statut sans ouvrir la fiche : c'est l'action qu'on
            faisait le plus souvent depuis la table, elle est conservée. */}
        <div className="pt-1">
          <Select
            value={status}
            onChange={(next) => {
              if (!isProjectStatus(next) || next === status) return;
              // Optimiste avec retour arrière, comme la table qu'elle
              // remplace : le statut se change d'un geste et se répare tout
              // seul si l'écriture échoue.
              const previous = status;
              setStatus(next);
              startTransition(async () => {
                try {
                  const formData = new FormData();
                  formData.set("status", next);
                  await updateProject(project.id, formData);
                } catch {
                  setStatus(previous);
                }
              });
            }}
            disabled={pending}
            options={PROJECT_STATUSES.map((status) => ({ value: status, label: PROJECT_STATUS_LABELS[status] }))}
            className="w-full px-2.5 py-1.5 text-[11px]"
            style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>
      </div>
    </article>
  );
}
