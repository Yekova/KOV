"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { DEVICE_LABELS, PAGE_STATUS_COLORS, PAGE_STATUS_LABELS } from "@/lib/design/status";
import type { ApprovalNode, DeviceNode, FeedbackNode, PageNode, RevisionNode } from "@/lib/design/map";

// Les cinq formes de nœud de la carte.
//
// Elles ne portent aucun état : tout ce qu'elles affichent vient du nœud
// dérivé par buildValidationMap. Un nœud ne peut donc pas contredire les
// données — il n'a pas de données à lui.
//
// La couleur de statut n'est jamais un fond (§7) : une pastille, un liseré
// à gauche, et c'est tout. Un aplat vert derrière un texte gris est
// illisible, et cinq cartes de couleurs différentes sur une même carte
// font un sapin.

// React Flow exige que `data` accepte n'importe quelle clé. Les types du
// domaine, eux, sont fermés — et doivent le rester : c'est ce qui fait
// qu'un nœud de page ne peut pas se voir attribuer un champ d'appareil.
// L'intersection satisfait la contrainte de la bibliothèque sans ouvrir
// les types dans map.ts.
type Flow<T> = T & Record<string, unknown>;

const SHELL =
  "kov-flow-node relative h-full w-full overflow-hidden text-left transition-shadow";

/** Les poignées sont invisibles : les liens sont dérivés, on n'en tire
 *  jamais un à la souris. Elles restent nécessaires — React Flow ancre
 *  les arêtes dessus. */
function Ports({ source = true, target = true }: { source?: boolean; target?: boolean }) {
  const hidden = { opacity: 0, width: 1, height: 1, border: "none", minWidth: 0, minHeight: 0 } as const;
  return (
    <>
      {target && <Handle type="target" position={Position.Left} style={hidden} isConnectable={false} />}
      {source && <Handle type="source" position={Position.Right} style={hidden} isConnectable={false} />}
    </>
  );
}

function StatusDot({ color }: { color: string }) {
  return <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

export function PageFlowNode({ data, selected }: NodeProps<Node<Flow<PageNode>>>) {
  const color = PAGE_STATUS_COLORS[data.status];
  return (
    <div className={SHELL} data-selected={selected || undefined}>
      <Ports target={false} />
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} aria-hidden="true" />
      <div className="flex h-full flex-col p-3 pl-4">
        <div className="flex items-baseline gap-2">
          <span className="text-kov-steel font-display text-[11px]">{String(data.index).padStart(2, "0")}</span>
          <span className="text-kov-bone truncate text-sm font-medium">{data.title}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-[10px] tracking-widest uppercase">
          <StatusDot color={color} />
          <span style={{ color }}>{PAGE_STATUS_LABELS[data.status]}</span>
          {data.versionLabel && <span className="text-kov-steel">{data.versionLabel}</span>}
        </div>

        <div
          className="relative mt-2 flex-1 overflow-hidden"
          style={{ borderRadius: "var(--radius-sm)", background: "var(--kov-surface-2)" }}
        >
          {data.thumbnailUrl ? (
            // URL signée, pas un asset statique : next/image ne sait pas
            // l'optimiser et la re-signerait à contretemps.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.thumbnailUrl} alt="" className="h-full w-full object-cover object-top" draggable={false} />
          ) : (
            <span className="text-kov-steel absolute inset-0 grid place-items-center text-[10px] tracking-widest uppercase">
              Pas encore de maquette
            </span>
          )}
        </div>

        {data.openCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px]">
            <span className="text-kov-concrete">
              {data.openCount} retour{data.openCount > 1 ? "s" : ""} à traiter
            </span>
            {data.blockingCount > 0 && (
              <span style={{ color: "var(--kov-red)" }}>· {data.blockingCount} bloquant{data.blockingCount > 1 ? "s" : ""}</span>
            )}
          </div>
        )}
      </div>
      <Ports source target={false} />
    </div>
  );
}

export function DeviceFlowNode({ data, selected }: NodeProps<Node<Flow<DeviceNode>>>) {
  return (
    <div className={SHELL} data-selected={selected || undefined}>
      <Ports />
      <div className="flex h-full flex-col justify-center p-3">
        <span className="text-kov-bone text-xs font-medium">{DEVICE_LABELS[data.device]}</span>
        <span className="text-kov-steel mt-1 text-[10px] tracking-widest uppercase">Maquette disponible</span>
      </div>
    </div>
  );
}

export function FeedbackFlowNode({ data, selected }: NodeProps<Node<Flow<FeedbackNode>>>) {
  return (
    <div className={SHELL} data-selected={selected || undefined}>
      <Ports />
      <div className="flex h-full flex-col justify-center p-3">
        <span className="text-kov-bone text-xs font-medium">Retours</span>
        <span className="text-kov-steel mt-1 text-[10px]">
          {data.total} au total
          {data.pending > 0 && (
            <span style={{ color: "var(--kov-status-orange)" }}> · {data.pending} à traiter</span>
          )}
        </span>
      </div>
    </div>
  );
}

export function RevisionFlowNode({ data, selected }: NodeProps<Node<Flow<RevisionNode>>>) {
  return (
    <div className={SHELL} data-selected={selected || undefined}>
      <Ports />
      <div className="flex h-full flex-col justify-center p-3">
        <span className="text-kov-bone text-xs font-medium">Révisions</span>
        <span className="mt-1 text-[10px]" style={{ color: "var(--kov-status-blue)" }}>
          {data.draftLabel ? `${data.draftLabel} en préparation` : "En cours chez KOV"}
        </span>
      </div>
    </div>
  );
}

export function ApprovalFlowNode({ data, selected }: NodeProps<Node<Flow<ApprovalNode>>>) {
  const color = data.ready ? "var(--kov-status-green)" : "var(--kov-steel)";
  return (
    <div className={SHELL} data-selected={selected || undefined} data-ready={data.ready || undefined}>
      <Ports source={false} />
      <div className="flex h-full flex-col justify-center p-4">
        <div className="flex items-center gap-2">
          <StatusDot color={color} />
          <span className="text-kov-bone text-sm font-medium">Validation finale</span>
        </div>
        <span className="text-kov-steel mt-2 text-[11px]">
          {data.totalPages === 0
            ? "Aucune page pour l'instant"
            : `${data.approvedPages} / ${data.totalPages} page${data.totalPages > 1 ? "s" : ""} validée${data.approvedPages > 1 ? "s" : ""}`}
        </span>
        {data.ready && (
          <span className="mt-2 text-[10px] tracking-widest uppercase" style={{ color }}>
            Prête à être validée
          </span>
        )}
      </div>
    </div>
  );
}

export const FLOW_NODE_TYPES = {
  page: PageFlowNode,
  device: DeviceFlowNode,
  feedback: FeedbackFlowNode,
  revision: RevisionFlowNode,
  approval: ApprovalFlowNode,
};
