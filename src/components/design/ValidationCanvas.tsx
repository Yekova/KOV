"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildValidationMap, type MapNode } from "@/lib/design/map";
import { PAGE_STATUS_COLORS } from "@/lib/design/status";
import type { ValidationBoard } from "@/lib/design/types";
import { FLOW_NODE_TYPES } from "./FlowNodes";
import { movePage } from "@/lib/design/actions";

// La carte. React Flow n'en dessine que la géométrie : la forme du graphe
// vient de buildValidationMap, qui la dérive des données.
//
// ── POURQUOI PAS D'EFFET DE SYNCHRONISATION ──────────────────────────
//
// Le réflexe serait useNodesState + un effet qui recopie les props dans
// l'état à chaque rafraîchissement. Le compilateur React l'interdit ici
// (react-hooks/set-state-in-effect), et il a raison : ce recopiage écrase
// une position en cours de glissement dès que le sondage revient.
//
// Les nœuds sont donc CALCULÉS à chaque rendu, et l'état ne retient que
// ce que l'utilisateur a déplacé depuis. Il n'est écrit que dans des
// gestionnaires d'évènement, jamais dans un effet.

type FlowNodeData = MapNode & Record<string, unknown>;

export function ValidationCanvas({
  board,
  selectedPageId,
  onSelectPage,
  canDrag,
}: {
  board: ValidationBoard;
  selectedPageId: string | null;
  onSelectPage: (pageId: string | null) => void;
  /** Seul KOV déplace les nœuds (§34/§68). */
  canDrag: boolean;
}) {
  const map = useMemo(() => buildValidationMap(board), [board]);
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});

  const nodes = useMemo<Node<FlowNodeData>[]>(
    () =>
      map.nodes.map((node) => ({
        id: node.id,
        type: node.kind,
        position: moved[node.id] ?? { x: node.x, y: node.y },
        data: node as FlowNodeData,
        width: node.width,
        height: node.height,
        selected: node.pageId !== null && node.pageId === selectedPageId,
        // Seules les pages bougent. Déplacer un appareil n'aurait aucun
        // sens : sa position découle de celle de sa page.
        draggable: canDrag && node.kind === "page",
      })),
    [map.nodes, moved, selectedPageId, canDrag]
  );

  const edges = useMemo<Edge[]>(
    () =>
      map.edges.map((edge) => {
        const lit = selectedPageId !== null && edge.pageId === selectedPageId;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: lit ? "var(--kov-red)" : "var(--kov-border)",
            strokeWidth: lit ? 1.6 : 1,
          },
        };
      }),
    [map.edges, selectedPageId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<FlowNodeData>>[]) => {
      // On n'applique que les déplacements : la sélection est pilotée par
      // le parent, et la suppression n'existe pas sur une carte dérivée.
      const positional = changes.filter((change) => change.type === "position");
      if (positional.length === 0) return;
      setMoved((previous) => {
        const applied = applyNodeChanges(positional, nodes);
        const next = { ...previous };
        for (const node of applied) {
          if (node.position) next[node.id] = node.position;
        }
        return next;
      });
    },
    [nodes]
  );

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node<FlowNodeData>) => {
      const data = node.data as MapNode;
      if (data.kind !== "page") return;
      // On n'attend pas la réponse : la position est déjà à l'écran, et
      // l'action ne revalide rien pour ne pas reconstruire le canvas sous
      // le curseur.
      void movePage(data.pageId, Math.round(node.position.x), Math.round(node.position.y));
    },
    []
  );

  return (
    <div className="kov-flow h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={FLOW_NODE_TYPES}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_event, node) => {
          onSelectPage((node.data as unknown as MapNode).pageId);
        }}
        onPaneClick={() => onSelectPage(null)}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={canDrag}
        nodesConnectable={false}
        edgesFocusable={false}
        elementsSelectable
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--kov-border)" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          pannable
          zoomable
          position="bottom-left"
          maskColor="rgba(0,0,0,0.04)"
          nodeColor={(node) => {
            const data = node.data as unknown as MapNode;
            return data.kind === "page" ? PAGE_STATUS_COLORS[data.status] : "var(--kov-border)";
          }}
        />
      </ReactFlow>
    </div>
  );
}
