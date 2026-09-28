"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreVertical, CalendarDays, Activity } from "lucide-react";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { ClientSummary, ClientTeamMember } from "@/lib/admin/clients";

// La carte d'un client.
//
// Elle répond à trois questions dans cet ordre : qui, où en est-on, et
// qu'est-ce qui tombe ensuite. Le reste est du détail qui vit sur la fiche.
//
// ── CE QUI N'Y EST PAS, ET POURQUOI ──────────────────────────────────────
//
// Pas de secteur d'activité (« SaaS · B2B ») : aucune colonne ne le porte.
// L'afficher demanderait de le deviner à partir du nom, ce qui est une
// invention avec l'apparence d'une donnée.
//
// Pas d'équipe de complaisance : les visages viennent des tâches réellement
// assignées, plus le responsable de compte. Deux personnes s'affichent à
// deux, pas à « +3 ».
//
// Une carte à moitié vide dit la vérité sur ce qui manque en base. C'est
// une information utile : elle montre quoi renseigner.

const STATUS_COLORS: Record<string, string> = {
  in_progress: "var(--kov-red)",
  in_review: "var(--kov-concrete)",
  on_hold: "#F5A524",
  done: "var(--kov-steel)",
};

function displayName(client: ClientSummary): string {
  return client.company?.trim() || client.fullName?.trim() || client.email || "Client sans nom";
}

function subtitle(client: ClientSummary): string | null {
  const primary = displayName(client);
  const candidates = [client.fullName?.trim(), client.email].filter((value): value is string => Boolean(value));
  return candidates.find((value) => value !== primary) ?? null;
}

function formatDeadline(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function TeamStack({ team }: { team: ClientTeamMember[] }) {
  if (team.length === 0) return null;
  const shown = team.slice(0, 4);
  const extra = team.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((member, index) => (
        <span
          key={member.id}
          className="rounded-full"
          style={{ marginLeft: index === 0 ? 0 : -8, boxShadow: "0 0 0 2px var(--kov-carbon)" }}
          title={member.isAccountManager ? `${member.name ?? "Sans nom"} · responsable` : (member.name ?? "Sans nom")}
        >
          <ClientAvatar name={member.name} avatarUrl={member.avatarUrl} size={26} />
        </span>
      ))}
      {extra > 0 && <span className="text-kov-steel text-[11px] ml-2 tabular-nums">+{extra}</span>}
    </div>
  );
}

export function ClientCard({
  client,
  onArchive,
  onUnarchive,
}: {
  client: ClientSummary;
  onArchive: (client: ClientSummary) => void;
  onUnarchive: (client: ClientSummary) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const project = client.leadProject;
  const name = displayName(client);
  const second = subtitle(client);

  return (
    <article
      className="relative flex flex-col border transition-colors hover:border-kov-red"
      style={{
        borderColor: "var(--kov-border)",
        borderRadius: "var(--radius-md, 10px)",
        background: "var(--kov-carbon)",
        opacity: client.archivedAt ? 0.6 : 1,
      }}
    >
      {/* ── Identité ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <ClientAvatar name={name} avatarUrl={client.avatarUrl} size={40} />

        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/clients/${client.id}`}
            className="block text-kov-bone text-sm truncate hover:text-kov-red transition-colors"
          >
            {name}
          </Link>
          {second ? (
            <p className="text-kov-steel text-[11px] truncate mt-0.5">{second}</p>
          ) : (
            // Dire ce qui manque plutôt que laisser un blanc : c'est la
            // ligne qui fait aller remplir la fiche.
            <p className="text-kov-steel text-[11px] truncate mt-0.5">Société non renseignée</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="px-2.5 py-1 text-[10px] uppercase tracking-widest whitespace-nowrap"
            style={{
              borderRadius: "var(--radius-pill)",
              border: `1px solid ${client.status ? STATUS_COLORS[client.status] : "var(--kov-border)"}`,
              color: client.status ? STATUS_COLORS[client.status] : "var(--kov-steel)",
            }}
          >
            {client.archivedAt ? "Archivé" : (project?.statusLabel ?? "Sans projet")}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              aria-label={`Actions pour ${name}`}
              aria-expanded={menuOpen}
              className="p-1 text-kov-steel hover:text-kov-bone transition-colors"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div
                className="absolute z-20 right-0 top-full mt-1 py-1 whitespace-nowrap"
                style={{
                  background: "var(--kov-graphite)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="block px-4 py-2 text-xs text-kov-steel hover:text-kov-red transition-colors"
                >
                  Ouvrir la fiche
                </Link>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setMenuOpen(false);
                    if (client.archivedAt) onUnarchive(client);
                    else onArchive(client);
                  }}
                  className="block w-full px-4 py-2 text-left text-xs text-kov-steel hover:text-kov-red transition-colors"
                >
                  {client.archivedAt ? "Désarchiver" : "Archiver"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Avancement ────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        {project ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={`/admin/projects/${project.id}`}
                className="text-kov-concrete text-xs truncate hover:text-kov-red transition-colors"
              >
                {project.name}
              </Link>
              <span className="text-kov-steel text-[11px] shrink-0 truncate max-w-[45%]">
                {project.currentPhaseName ?? project.statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div
                className="h-1 flex-1 overflow-hidden"
                style={{ background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${project.progressPercent}%`,
                    background: STATUS_COLORS[project.status] ?? "var(--kov-steel)",
                  }}
                />
              </div>
              <span className="text-kov-bone text-[11px] tabular-nums shrink-0">{project.progressPercent} %</span>
            </div>

            {/* D'où vient le pourcentage. « 1 phase sur 7 » se vérifie ;
                « 16 % » saisi à la main ne se vérifie pas, et l'écran doit
                dire lequel des deux il montre. */}
            <p className="text-kov-steel text-[10px] mt-1.5">
              {project.progressSource === "phases"
                ? `${project.phasesCompleted} phase${project.phasesCompleted > 1 ? "s" : ""} terminée${project.phasesCompleted > 1 ? "s" : ""} sur ${project.phasesTotal}`
                : "avancement saisi à la main, aucune phase définie"}
              {client.projects.length > 1 && ` · ${client.projects.length} projets`}
            </p>
          </>
        ) : (
          <p className="text-kov-steel text-xs">Aucun projet rattaché.</p>
        )}
      </div>

      {/* ── Ce qui tombe, et ce qui s'est passé ───────────────────────── */}
      <div
        className="px-4 py-3 border-t space-y-2 mt-auto"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <div className="flex items-start gap-2.5">
          <CalendarDays size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 text-[11px] leading-snug">
            {project?.nextDeadlineDate ? (
              <>
                <p className="text-kov-concrete truncate">
                  {project.nextDeadlineLabel?.trim() || "Prochaine échéance"}
                </p>
                <p className="text-kov-steel">{formatDeadline(project.nextDeadlineDate)}</p>
              </>
            ) : (
              <p className="text-kov-steel">Aucune échéance renseignée</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Activity size={13} className="text-kov-steel shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 text-[11px] leading-snug flex-1">
            {client.lastActivity ? (
              <>
                <p className="text-kov-concrete truncate">{client.lastActivity.title}</p>
                <p className="text-kov-steel">{formatRelativeTime(client.lastActivity.createdAt)}</p>
              </>
            ) : (
              <p className="text-kov-steel">Aucune activité enregistrée</p>
            )}
          </div>
          <TeamStack team={client.team} />
        </div>
      </div>
    </article>
  );
}
