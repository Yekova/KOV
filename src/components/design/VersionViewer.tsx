"use client";

import { useCallback, useRef, useState } from "react";
import { DEVICE_LABELS, DEVICES, VERSION_STATUS_LABELS, type Device } from "@/lib/design/status";
import type { DesignComment, DesignVersion } from "@/lib/design/types";

// Le visualiseur : la maquette, et les épingles posées dessus.
//
// ── POURQUOI DES POURCENTAGES ────────────────────────────────────────
//
// Une épingle est stockée en pourcentage de la largeur et de la hauteur
// (design_comments.x_percent / y_percent). En pixels, elle serait juste
// sur l'écran qui l'a posée et fausse partout ailleurs — et le même
// commentaire désignerait un autre endroit après un zoom.
//
// Le zoom applique donc une simple mise à l'échelle sur le conteneur, et
// chaque épingle se remet à l'échelle inverse pour garder sa taille : une
// pastille qui grossit avec l'image finirait par cacher ce qu'elle
// désigne.

const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2] as const;

export function VersionViewer({
  version,
  device,
  onDeviceChange,
  availableDevices,
  comments,
  selectedCommentId,
  hoveredCommentId,
  onSelectComment,
  draftPin,
  onPlacePin,
  canComment,
}: {
  version: DesignVersion | null;
  device: Device;
  onDeviceChange: (device: Device) => void;
  availableDevices: Device[];
  /** Les retours racines de cette version ET de cet appareil, dans
   *  l'ordre où ils ont été déposés — c'est cet ordre qui numérote les
   *  épingles. */
  comments: DesignComment[];
  selectedCommentId: string | null;
  hoveredCommentId: string | null;
  onSelectComment: (commentId: string | null) => void;
  draftPin: { x: number; y: number } | null;
  onPlacePin: (position: { x: number; y: number } | null) => void;
  canComment: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canComment) return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      onPlacePin({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) });
      onSelectComment(null);
    },
    [canComment, onPlacePin, onSelectComment]
  );

  const asset = version?.assets[device] ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* ── La barre : appareil, version, zoom ── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-center gap-1">
          {DEVICES.filter((d) => availableDevices.includes(d)).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDeviceChange(d)}
              aria-pressed={d === device}
              className="px-3 py-1.5 text-[11px] tracking-widest uppercase transition-colors"
              style={{
                borderRadius: "var(--radius-pill)",
                background: d === device ? "var(--kov-red)" : "transparent",
                color: d === device ? "var(--kov-white)" : "var(--kov-concrete)",
              }}
            >
              {DEVICE_LABELS[d]}
            </button>
          ))}
        </div>

        {version && (
          <span className="text-kov-steel text-[11px] tracking-widest uppercase">
            {version.label} · {VERSION_STATUS_LABELS[version.status]}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => ZOOM_STEPS[Math.max(0, ZOOM_STEPS.indexOf(z as (typeof ZOOM_STEPS)[number]) - 1)] ?? 0.5)}
            className="text-kov-concrete hover:text-kov-red h-8 w-8 text-sm transition-colors"
            aria-label="Dézoomer"
          >
            −
          </button>
          <span className="text-kov-steel w-12 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)} %</span>
          <button
            type="button"
            onClick={() => setZoom((z) => ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, ZOOM_STEPS.indexOf(z as (typeof ZOOM_STEPS)[number]) + 1)] ?? 2)}
            className="text-kov-concrete hover:text-kov-red h-8 w-8 text-sm transition-colors"
            aria-label="Zoomer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="text-kov-concrete hover:text-kov-red ml-1 px-2 text-[10px] tracking-widest uppercase transition-colors"
          >
            Ajuster
          </button>
          {version?.previewUrl && (
            <a
              href={version.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-kov-concrete hover:text-kov-red ml-2 px-2 text-[10px] tracking-widest uppercase transition-colors"
            >
              Ouvrir la préversion
            </a>
          )}
        </div>
      </div>

      {/* ── La maquette ── */}
      <div className="flex-1 overflow-auto p-6" style={{ background: "var(--kov-surface-2)" }}>
        {!asset ? (
          <p className="text-kov-steel py-16 text-center text-sm">
            {version
              ? `Aucune maquette ${DEVICE_LABELS[device].toLowerCase()} pour ${version.label}.`
              : "Aucune version publiée pour cette page."}
          </p>
        ) : (
          <div
            className="mx-auto origin-top transition-transform"
            style={{ transform: `scale(${zoom})`, width: "min(100%, 1200px)" }}
          >
            <div
              ref={surfaceRef}
              onClick={handleClick}
              className="relative w-full"
              style={{ cursor: canComment ? "crosshair" : "default" }}
            >
              {/* URL signée : hors du champ de next/image, qui la
                  ré-écrirait et la re-signerait à contretemps. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset} alt={`Maquette ${DEVICE_LABELS[device]}`} className="block w-full" draggable={false} />

              {comments.map((comment, index) => {
                if (comment.x === null || comment.y === null) return null;
                const active = comment.id === selectedCommentId || comment.id === hoveredCommentId;
                return (
                  <button
                    key={comment.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectComment(comment.id);
                      onPlacePin(null);
                    }}
                    className="kov-pin absolute"
                    data-active={active || undefined}
                    data-resolved={comment.status === "resolved" || undefined}
                    style={{
                      left: `${comment.x}%`,
                      top: `${comment.y}%`,
                      // Contre-échelle : l'épingle garde sa taille quel
                      // que soit le zoom, et son centre reste sur le point.
                      transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                    }}
                    aria-label={`Retour ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}

              {draftPin && (
                <span
                  className="kov-pin"
                  data-draft="true"
                  style={{
                    position: "absolute",
                    left: `${draftPin.x}%`,
                    top: `${draftPin.y}%`,
                    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {canComment && (
        <p className="text-kov-steel border-t px-4 py-2 text-[11px]" style={{ borderColor: "var(--kov-border)" }}>
          Cliquez sur la maquette pour déposer un retour à cet endroit précis.
        </p>
      )}
    </div>
  );
}
