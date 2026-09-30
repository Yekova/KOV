"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  COMMENT_STATUS_COLORS,
  COMMENT_STATUS_LABELS,
  describeAuthor,
  isCommentPending,
  type AuthorSide,
  type CommentStatus,
  type Device,
} from "@/lib/design/status";
import type { DesignComment } from "@/lib/design/types";
import { addComment, changeCommentStatus } from "@/lib/design/actions";
import { KovSpinner } from "@/components/ui/KovSpinner";

// Le panneau des retours.
//
// ── CE QUI EST OPTIMISTE, ET CE QUI NE L'EST PAS ─────────────────────
//
// Déposer un retour et changer son statut s'affichent avant la réponse du
// serveur : ce sont des gestes dont l'utilisateur connaît déjà l'issue, et
// l'attente ne lui apprend rien.
//
// En cas d'échec, le texte saisi est RENDU au champ plutôt que perdu
// (§73) : c'est la seule chose que l'utilisateur ne peut pas refaire d'un
// clic.

type Filter = "all" | "pending" | "resolved";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "pending", label: "À traiter" },
  { id: "resolved", label: "Résolus" },
];

interface OptimisticAdd {
  kind: "add";
  comment: DesignComment;
}
interface OptimisticStatus {
  kind: "status";
  commentId: string;
  status: CommentStatus;
}
type OptimisticAction = OptimisticAdd | OptimisticStatus;

function applyOptimistic(current: DesignComment[], action: OptimisticAction): DesignComment[] {
  if (action.kind === "add") {
    if (action.comment.parentId) {
      return current.map((root) =>
        root.id === action.comment.parentId ? { ...root, replies: [...root.replies, action.comment] } : root
      );
    }
    return [...current, action.comment];
  }
  return current.map((root) => (root.id === action.commentId ? { ...root, status: action.status } : root));
}

export function CommentsPanel({
  projectId,
  pageId,
  versionId,
  device,
  comments,
  viewer,
  viewerId,
  selectedCommentId,
  onSelectComment,
  onHoverComment,
  draftPin,
  onClearDraftPin,
}: {
  projectId: string;
  pageId: string;
  versionId: string | null;
  device: Device;
  comments: DesignComment[];
  viewer: AuthorSide;
  viewerId: string;
  selectedCommentId: string | null;
  onSelectComment: (id: string | null) => void;
  onHoverComment: (id: string | null) => void;
  draftPin: { x: number; y: number } | null;
  onClearDraftPin: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [optimistic, dispatch] = useOptimistic(comments, applyOptimistic);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (filter === "pending") return optimistic.filter((c) => isCommentPending(c.status));
    if (filter === "resolved") return optimistic.filter((c) => !isCommentPending(c.status));
    return optimistic;
  }, [optimistic, filter]);

  const counts = useMemo(
    () => ({
      all: optimistic.length,
      pending: optimistic.filter((c) => isCommentPending(c.status)).length,
      resolved: optimistic.filter((c) => !isCommentPending(c.status)).length,
    }),
    [optimistic]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-4 py-3" style={{ borderColor: "var(--kov-border)" }}>
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setFilter(entry.id)}
            aria-pressed={filter === entry.id}
            className="px-3 py-1.5 text-[11px] tracking-widest uppercase transition-colors"
            style={{
              borderRadius: "var(--radius-pill)",
              background: filter === entry.id ? "var(--kov-surface-3)" : "transparent",
              color: filter === entry.id ? "var(--kov-bone)" : "var(--kov-concrete)",
            }}
          >
            {entry.label} <span className="tabular-nums">{counts[entry.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-kov-steel px-4 py-10 text-center text-sm">
            {filter === "all"
              ? "Aucun retour sur cette version."
              : filter === "pending"
                ? "Rien à traiter."
                : "Aucun retour réglé."}
          </p>
        ) : (
          <ul>
            {visible.map((comment, index) => (
              <Thread
                key={comment.id}
                comment={comment}
                index={optimistic.indexOf(comment) + 1 || index + 1}
                projectId={projectId}
                pageId={pageId}
                versionId={versionId}
                device={device}
                viewer={viewer}
                viewerId={viewerId}
                selected={comment.id === selectedCommentId}
                onSelect={onSelectComment}
                onHover={onHoverComment}
                dispatch={dispatch}
                startTransition={startTransition}
              />
            ))}
          </ul>
        )}
      </div>

      <Composer
        projectId={projectId}
        pageId={pageId}
        versionId={versionId}
        device={device}
        viewer={viewer}
        viewerId={viewerId}
        pin={draftPin}
        onDone={onClearDraftPin}
        dispatch={dispatch}
        startTransition={startTransition}
      />
    </div>
  );
}

// ── UN FIL ───────────────────────────────────────────────────────────

function Thread({
  comment,
  index,
  projectId,
  pageId,
  versionId,
  device,
  viewer,
  viewerId,
  selected,
  onSelect,
  onHover,
  dispatch,
  startTransition,
}: {
  comment: DesignComment;
  index: number;
  projectId: string;
  pageId: string;
  versionId: string | null;
  device: Device;
  viewer: AuthorSide;
  viewerId: string;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  dispatch: (action: OptimisticAction) => void;
  startTransition: (run: () => void) => void;
}) {
  const [replying, setReplying] = useState(false);

  function setStatus(status: CommentStatus) {
    startTransition(async () => {
      dispatch({ kind: "status", commentId: comment.id, status });
      const result = await changeCommentStatus(projectId, comment.id, status);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <li
      className="kov-thread border-b px-4 py-4"
      style={{ borderColor: "var(--kov-border)" }}
      data-selected={selected || undefined}
      onMouseEnter={() => onHover(comment.id)}
      onMouseLeave={() => onHover(null)}
    >
      <button type="button" onClick={() => onSelect(selected ? null : comment.id)} className="w-full text-left">
        <div className="flex items-center gap-2">
          {comment.x !== null && (
            <span className="kov-pin kov-pin--inline" data-static="true">
              {index}
            </span>
          )}
          <span className="text-kov-bone text-xs font-medium">
            {describeAuthor(comment.authorSide, comment.authorName, viewer)}
          </span>
          <span className="text-kov-steel text-[11px]">{formatRelativeTime(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-kov-steel text-[10px]">· modifié</span>}
        </div>

        <p className="text-kov-concrete mt-2 text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10px] tracking-widest uppercase"
            style={{
              borderRadius: "var(--radius-pill)",
              color: COMMENT_STATUS_COLORS[comment.status],
              border: `1px solid ${COMMENT_STATUS_COLORS[comment.status]}`,
            }}
          >
            {COMMENT_STATUS_LABELS[comment.status]}
          </span>
          {comment.isBlocking && isCommentPending(comment.status) && (
            <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--kov-red)" }}>
              Bloquant
            </span>
          )}
        </div>
      </button>

      {comment.replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l pl-3" style={{ borderColor: "var(--kov-border)" }}>
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <div className="flex items-center gap-2">
                <span className="text-kov-bone text-[11px] font-medium">
                  {describeAuthor(reply.authorSide, reply.authorName, viewer)}
                </span>
                <span className="text-kov-steel text-[10px]">{formatRelativeTime(reply.createdAt)}</span>
              </div>
              <p className="text-kov-concrete mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">{reply.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] tracking-widest uppercase">
        <button type="button" onClick={() => setReplying((v) => !v)} className="text-kov-concrete hover:text-kov-red transition-colors">
          {replying ? "Annuler" : "Répondre"}
        </button>

        {/* KOV traite ; le client rouvre (§56). Chacun ne voit que les
            gestes qui lui appartiennent — pas de bouton grisé pour dire
            « pas vous ». */}
        {viewer === "admin" ? (
          <>
            {comment.status !== "in_progress" && (
              <button type="button" onClick={() => setStatus("in_progress")} className="text-kov-concrete hover:text-kov-red transition-colors">
                En cours
              </button>
            )}
            {comment.status !== "resolved" && (
              <button type="button" onClick={() => setStatus("resolved")} className="text-kov-concrete hover:text-kov-red transition-colors">
                Résoudre
              </button>
            )}
            {comment.status !== "rejected" && (
              <button type="button" onClick={() => setStatus("rejected")} className="text-kov-concrete hover:text-kov-red transition-colors">
                Non retenu
              </button>
            )}
          </>
        ) : (
          !isCommentPending(comment.status) && (
            <button type="button" onClick={() => setStatus("open")} className="text-kov-concrete hover:text-kov-red transition-colors">
              Rouvrir
            </button>
          )
        )}
      </div>

      {replying && versionId && (
        <Composer
          inline
          projectId={projectId}
          pageId={pageId}
          versionId={versionId}
          device={device}
          viewer={viewer}
          viewerId={viewerId}
          parentId={comment.id}
          pin={null}
          onDone={() => setReplying(false)}
          dispatch={dispatch}
          startTransition={startTransition}
        />
      )}
    </li>
  );
}

// ── LE CHAMP DE SAISIE ───────────────────────────────────────────────

function Composer({
  projectId,
  pageId,
  versionId,
  device,
  viewer,
  viewerId,
  parentId = null,
  pin,
  onDone,
  dispatch,
  startTransition,
  inline = false,
}: {
  projectId: string;
  pageId: string;
  versionId: string | null;
  device: Device;
  viewer: AuthorSide;
  viewerId: string;
  parentId?: string | null;
  pin: { x: number; y: number } | null;
  onDone: () => void;
  dispatch: (action: OptimisticAction) => void;
  startTransition: (run: () => void) => void;
  inline?: boolean;
}) {
  const [body, setBody] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [pending, setPending] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  if (!versionId) {
    return inline ? null : (
      <p className="text-kov-steel border-t px-4 py-4 text-[11px]" style={{ borderColor: "var(--kov-border)" }}>
        Aucune version publiée : il n&apos;y a rien à commenter pour l&apos;instant.
      </p>
    );
  }

  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setPending(true);

    startTransition(async () => {
      const optimisticComment: DesignComment = {
        id: `optimistic-${Date.now()}`,
        pageId,
        versionId: versionId!,
        parentId,
        device,
        authorId: viewerId,
        authorSide: viewer,
        // Le nom reste nul : on ne le connaît pas ici, et describeAuthor
        // dit « Vous » — ce qui est vrai — plutôt qu'un nom deviné.
        authorName: null,
        x: parentId ? null : (pin?.x ?? null),
        y: parentId ? null : (pin?.y ?? null),
        body: text,
        status: "open",
        isBlocking: parentId ? false : blocking,
        mentionedIds: [],
        attachmentUrl: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
        resolvedAt: null,
        canEdit: true,
        replies: [],
      };
      dispatch({ kind: "add", comment: optimisticComment });

      const result = await addComment({
        projectId,
        pageId,
        versionId: versionId!,
        parentId,
        device,
        x: pin?.x ?? null,
        y: pin?.y ?? null,
        body: text,
        isBlocking: blocking,
      });

      setPending(false);
      if (result.error) {
        // Le texte revient dans le champ : c'est la seule chose que
        // l'utilisateur ne peut pas refaire d'un clic.
        toast.error(result.error);
        setBody(text);
        fieldRef.current?.focus();
        return;
      }
      setBody("");
      setBlocking(false);
      onDone();
    });
  }

  return (
    <div className={inline ? "mt-3" : "border-t p-4"} style={inline ? undefined : { borderColor: "var(--kov-border)" }}>
      {pin && !inline && (
        <p className="text-kov-steel mb-2 text-[11px]">
          Retour épinglé à {Math.round(pin.x)} % / {Math.round(pin.y)} % de la maquette.
        </p>
      )}
      <textarea
        ref={fieldRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
        }}
        rows={inline ? 2 : 3}
        placeholder={parentId ? "Votre réponse…" : "Votre retour sur cette maquette…"}
        className="text-kov-bone focus:border-kov-red w-full resize-none border bg-transparent px-3 py-2 text-sm transition-colors focus:outline-none"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      />

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {!parentId && (
          <label className="text-kov-concrete flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={blocking} onChange={(event) => setBlocking(event.target.checked)} />
            Bloquant pour la validation
          </label>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={pending || body.trim().length === 0}
          className="text-kov-white ml-auto inline-flex h-9 items-center gap-2 px-4 text-[11px] tracking-widest uppercase transition-colors disabled:opacity-50"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
        >
          {pending && <KovSpinner accent="var(--kov-white)" />}
          {parentId ? "Répondre" : "Envoyer le retour"}
        </button>
      </div>
    </div>
  );
}
