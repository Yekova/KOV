"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { KovActionButton, type ActionState } from "@/components/ui/KovActionButton";
import { ValidationCanvas } from "./ValidationCanvas";
import { VersionViewer } from "./VersionViewer";
import { CommentsPanel } from "./CommentsPanel";
import { ActivityFeed } from "./ActivityFeed";
import { approveEverything, decide, fetchValidationBoard } from "@/lib/design/actions";
import { DEVICES, PAGE_STATUS_COLORS, PAGE_STATUS_LABELS, type Device } from "@/lib/design/status";
import type { DesignActivityEntry, ValidationBoard } from "@/lib/design/types";
import "./validation.css";

// L'espace de validation : la carte, la maquette, les retours.
//
// ── POURQUOI UN SONDAGE ET PAS DU TEMPS RÉEL ─────────────────────────
//
// Le temps réel de Supabase suppose que le navigateur lise la base
// directement, sous RLS. Or ce projet lit tout côté serveur, et AUCUNE
// politique n'autorise aujourd'hui un admin à lire depuis son navigateur.
// L'activer demanderait d'ouvrir cette surface d'un coup, pour un gain
// mesuré en secondes.
//
// Le panneau se recharge donc toutes les huit secondes, et seulement
// quand l'onglet est visible — un onglet en arrière-plan qui interroge le
// serveur toute la journée coûte sans rien apprendre. Le schéma est écrit
// pour que le temps réel se substitue à ceci sans rien redessiner.

const POLL_MS = 8000;

export function ValidationWorkspace({
  initialBoard,
  activity = [],
}: {
  initialBoard: ValidationBoard;
  activity?: DesignActivityEntry[];
}) {
  const [board, setBoard] = useState(initialBoard);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialBoard.pages[0]?.id ?? null);
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [confirming, setConfirming] = useState<"approve" | "changes" | "approveAll" | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");

  const isAdmin = board.viewer === "admin";

  // Le sondage. setState vit dans le rappel de l'intervalle, jamais dans
  // le corps de l'effet — le compilateur React refuse le second.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void fetchValidationBoard(board.projectId).then((fresh) => {
        if (fresh) setBoard(fresh);
      });
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [board.projectId]);

  const page = useMemo(
    () => board.pages.find((p) => p.id === selectedPageId) ?? board.pages[0] ?? null,
    [board.pages, selectedPageId]
  );
  const version = useMemo(
    () => page?.versions.find((v) => v.id === page.currentVersionId) ?? null,
    [page]
  );

  const availableDevices = useMemo(
    () => DEVICES.filter((d) => version?.assets[d]),
    [version]
  );
  const activeDevice = availableDevices.includes(device) ? device : (availableDevices[0] ?? "desktop");

  // Les retours affichés sont ceux de la version ouverte ET de l'appareil
  // ouvert : une épingle posée sur le mobile n'a pas de place sur le
  // desktop, où elle désignerait autre chose.
  const comments = useMemo(() => {
    if (!page || !version) return [];
    return page.threads.filter((c) => c.versionId === version.id && c.device === activeDevice);
  }, [page, version, activeDevice]);

  const selectPage = useCallback((pageId: string | null) => {
    setSelectedPageId(pageId);
    setSelectedCommentId(null);
    setDraftPin(null);
  }, []);

  async function run(work: () => Promise<{ error?: string }>, success: string) {
    setActionState("loading");
    const result = await work();
    if (result.error) {
      setActionState("error");
      toast.error(result.error);
      return;
    }
    setActionState("success");
    toast.success(success);
    setConfirming(null);
    const fresh = await fetchValidationBoard(board.projectId);
    if (fresh) setBoard(fresh);
  }

  function runDecision(decision: "approved" | "changes_requested") {
    if (!page || !version) return;
    void run(
      () => decide({ projectId: board.projectId, pageId: page.id, versionId: version.id, decision }),
      decision === "approved" ? "Page validée." : "Modifications demandées."
    );
  }

  function runApproveAll() {
    void run(() => approveEverything(board.projectId), "Ensemble des maquettes validé.");
  }

  if (board.pages.length === 0) {
    return (
      <div className="kov-card px-6 py-16 text-center">
        <p className="text-kov-bone text-sm">Aucune maquette disponible.</p>
        <p className="text-kov-steel mx-auto mt-2 max-w-sm text-sm leading-relaxed">
          {isAdmin
            ? "Ajoutez une page, puis déposez-y une première version pour l'ouvrir à la validation."
            : "KOV ajoutera ici les premières propositions lorsqu'elles seront prêtes."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tally board={board} />

      {/* Le basculement mobile (§43) : la carte complète n'est pas lisible
          sous 1024 px, et une carte illisible vaut moins qu'une liste. */}
      <div className="flex items-center gap-1 lg:hidden">
        {(["list", "map"] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setMobileView(view)}
            aria-pressed={mobileView === view}
            className="px-3 py-1.5 text-[11px] tracking-widest uppercase transition-colors"
            style={{
              borderRadius: "var(--radius-pill)",
              background: mobileView === view ? "var(--kov-surface-3)" : "transparent",
              color: mobileView === view ? "var(--kov-bone)" : "var(--kov-concrete)",
            }}
          >
            {view === "list" ? "Liste" : "Carte"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ── La carte ── */}
        <div
          className={`kov-card overflow-hidden ${mobileView === "map" ? "" : "hidden"} lg:block`}
          style={{ height: "min(72vh, 680px)" }}
        >
          <ValidationCanvas
            board={board}
            selectedPageId={page?.id ?? null}
            onSelectPage={selectPage}
            canDrag={isAdmin}
          />
        </div>

        {/* ── La page ouverte ── */}
        <div className={`flex flex-col gap-4 ${mobileView === "list" ? "" : "hidden"} lg:flex`}>
          {page && (
            <div className="kov-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-kov-bone truncate text-sm font-medium">{page.title}</h2>
                  <p className="mt-0.5 text-[11px] tracking-widest uppercase" style={{ color: PAGE_STATUS_COLORS[page.status] }}>
                    {PAGE_STATUS_LABELS[page.status]}
                  </p>
                </div>

                {version && page.status !== "approved" && (
                  <div className="ml-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming("changes")}
                      className="text-kov-bone hover:border-kov-red hover:text-kov-red inline-flex h-9 items-center border px-4 text-[11px] tracking-widest uppercase transition-colors"
                      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
                    >
                      Demander des modifications
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming("approve")}
                      className="text-kov-white hover:bg-kov-red-signal inline-flex h-9 items-center px-4 text-[11px] tracking-widest uppercase transition-colors"
                      style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
                    >
                      Valider cette page
                    </button>
                  </div>
                )}
              </div>

              <div style={{ height: "min(52vh, 520px)" }}>
                <VersionViewer
                  version={version}
                  device={activeDevice}
                  onDeviceChange={setDevice}
                  availableDevices={availableDevices}
                  comments={comments}
                  selectedCommentId={selectedCommentId}
                  hoveredCommentId={hoveredCommentId}
                  onSelectComment={setSelectedCommentId}
                  draftPin={draftPin}
                  onPlacePin={setDraftPin}
                  canComment={Boolean(version)}
                />
              </div>
            </div>
          )}

          {page && (
            <div className="kov-card overflow-hidden" style={{ height: "min(46vh, 460px)" }}>
              <CommentsPanel
                projectId={board.projectId}
                pageId={page.id}
                versionId={version?.id ?? null}
                device={activeDevice}
                comments={comments}
                viewer={board.viewer}
                viewerId={board.viewerId}
                selectedCommentId={selectedCommentId}
                onSelectComment={setSelectedCommentId}
                onHoverComment={setHoveredCommentId}
                draftPin={draftPin}
                onClearDraftPin={() => setDraftPin(null)}
              />
            </div>
          )}
        </div>
      </div>

      {board.canApproveAll && (
        <div className="kov-card flex flex-wrap items-center gap-4 px-4 py-4">
          <p className="text-kov-bone text-sm">
            Toutes les pages sont validées. Vous pouvez clore l&apos;étape des maquettes.
          </p>
          <button
            type="button"
            onClick={() => setConfirming("approveAll")}
            className="text-kov-white hover:bg-kov-red-signal ml-auto inline-flex h-10 items-center px-5 text-[11px] tracking-widest uppercase transition-colors"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          >
            Valider l&apos;ensemble
          </button>
        </div>
      )}

      <ActivityFeed entries={activity} />

      {/* ── Les confirmations (§25) ── */}
      <Modal
        open={confirming === "approve"}
        onClose={() => setConfirming(null)}
        title="Confirmer la validation ?"
        footer={
          <div className="flex justify-end gap-2">
            <KovActionButton variant="secondary" type="button" state="idle" onClick={() => setConfirming(null)}>
              Annuler
            </KovActionButton>
            <KovActionButton variant="primary" type="button" state={actionState} onStateSettled={() => setActionState("idle")} loadingLabel="Validation…" onClick={() => runDecision("approved")}>
              Confirmer
            </KovActionButton>
          </div>
        }
      >
        <p className="text-kov-concrete text-sm leading-relaxed">
          Cette version sera marquée comme approuvée. KOV pourra passer à l&apos;étape suivante.
        </p>
      </Modal>

      <Modal
        open={confirming === "changes"}
        onClose={() => setConfirming(null)}
        title="Demander des modifications ?"
        footer={
          <div className="flex justify-end gap-2">
            <KovActionButton variant="secondary" type="button" state="idle" onClick={() => setConfirming(null)}>
              Annuler
            </KovActionButton>
            <KovActionButton variant="primary" type="button" state={actionState} onStateSettled={() => setActionState("idle")} loadingLabel="Envoi…" onClick={() => runDecision("changes_requested")}>
              Confirmer
            </KovActionButton>
          </div>
        }
      >
        <p className="text-kov-concrete text-sm leading-relaxed">
          Vos retours ouverts sur cette version partiront à KOV. Si vous n&apos;en avez déposé aucun, la demande sera
          refusée : sans contexte, elle n&apos;est pas interprétable.
        </p>
      </Modal>

      <Modal
        open={confirming === "approveAll"}
        onClose={() => setConfirming(null)}
        title="Valider l'ensemble des maquettes ?"
        footer={
          <div className="flex justify-end gap-2">
            <KovActionButton variant="secondary" type="button" state="idle" onClick={() => setConfirming(null)}>
              Annuler
            </KovActionButton>
            <KovActionButton variant="primary" type="button" state={actionState} onStateSettled={() => setActionState("idle")} loadingLabel="Validation…" onClick={runApproveAll}>
              Confirmer
            </KovActionButton>
          </div>
        }
      >
        <p className="text-kov-concrete text-sm leading-relaxed">
          Cette décision clôt l&apos;étape des maquettes pour l&apos;ensemble du projet. Elle est enregistrée avec sa date
          et son auteur.
        </p>
      </Modal>
    </div>
  );
}

/** Les compteurs permanents du §50 : le client doit savoir ce qui bloque
 *  sans ouvrir une page. Chaque nombre vient d'un compte réel. */
function Tally({ board }: { board: ValidationBoard }) {
  const entries = [
    { label: "Retours ouverts", value: board.tally.open },
    { label: "À traiter par vous", value: board.viewer === "client" ? board.tally.waitingOnClient : board.tally.waitingOnKov },
    { label: "En cours chez KOV", value: board.tally.waitingOnKov },
    { label: "Pages validées", value: `${board.tally.approvedPages} / ${board.tally.totalPages}` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {entries.map((entry) => (
        <div key={entry.label} className="kov-card px-4 py-3">
          <p className="text-kov-steel text-[10px] tracking-widest uppercase">{entry.label}</p>
          <p className="text-kov-bone mt-1 text-lg tabular-nums">{entry.value}</p>
        </div>
      ))}
    </div>
  );
}
