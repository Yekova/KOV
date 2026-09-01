"use client";

import { useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { uploadEditorImage } from "@/app/admin/content/actions";

export type CropRatio = "16/9" | "3/2" | "4/3" | "1/1";

const RATIOS: CropRatio[] = ["16/9", "3/2", "4/3", "1/1"];

// Final export size — the crop math below reproduces exactly what the CSS
// preview (object-fit: cover + transform: scale) shows on screen, so the
// uploaded file matches the preview pixel-for-pixel in framing.
const OUTPUT_W = 1200;

function evalRatio(ratio: CropRatio): number {
  const [w, h] = ratio.split("/").map(Number);
  return w / h;
}

interface ImageCropModalProps {
  /** Either a blob: URL (local file) or a remote http(s) URL, per isLocalSource. */
  source: string;
  isLocalSource: boolean;
  ratio: CropRatio;
  onRatioChange: (ratio: CropRatio) => void;
  posX: number;
  onPosXChange: (value: number) => void;
  posY: number;
  onPosYChange: (value: number) => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  onCancel: () => void;
  onConfirm: (url: string) => void;
}

export function ImageCropModal({
  source,
  isLocalSource,
  ratio,
  onRatioChange,
  posX,
  onPosXChange,
  posY,
  onPosYChange,
  zoom,
  onZoomChange,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  function handleConfirm() {
    startTransition(async () => {
      let bitmap: ImageBitmap;
      try {
        const res = await fetch(source, isLocalSource ? undefined : { mode: "cors" });
        const sourceBlob = await res.blob();
        bitmap = await createImageBitmap(sourceBlob);
      } catch {
        toast.error("Impossible de charger l'image depuis cette URL. Téléchargez-la puis ré-uploadez-la.");
        return;
      }

      const outputH = Math.round(OUTPUT_W / evalRatio(ratio));
      const imgW = bitmap.width;
      const imgH = bitmap.height;
      const containerW = OUTPUT_W;
      const containerH = outputH;

      const scaleCover = Math.max(containerW / imgW, containerH / imgH);
      const scaledW = imgW * scaleCover;
      const scaledH = imgH * scaleCover;
      const drawW = scaledW * zoom;
      const drawH = scaledH * zoom;
      const offsetX = (containerW - drawW) / 2 + (posX / 100 - 0.5) * (drawW - containerW);
      const offsetY = (containerH - drawH) / 2 + (posY / 100 - 0.5) * (drawH - containerH);

      const canvas = document.createElement("canvas");
      canvas.width = containerW;
      canvas.height = containerH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Le rognage a échoué.");
        return;
      }
      ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (!blob) {
        toast.error("Le rognage a échoué.");
        return;
      }

      try {
        const file = new File([blob], "cover.webp", { type: "image/webp" });
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadEditorImage(formData);
        if (result.error || !result.url) {
          toast.error(result.error ?? "Le téléversement a échoué.");
          return;
        }
        onConfirm(result.url);
      } catch {
        toast.error("Le téléversement a échoué.");
      }
    });
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rogner l'image"
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
      onClick={() => !isPending && onCancel()}
    >
      <GlassCard variant="solid" className="w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="font-display text-kov-bone text-lg uppercase">Rogner l&apos;image</p>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => !isPending && onCancel()}
            disabled={isPending}
            className="text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
          {/* Live preview — mirrors the exact canvas math used on confirm */}
          <div className="flex items-center justify-center" style={{ background: "var(--kov-black)", borderRadius: "var(--radius-sm)" }}>
            <div
              className="w-full overflow-hidden"
              style={{ aspectRatio: ratio, borderRadius: "var(--radius-sm)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={source}
                alt=""
                style={{
                  objectFit: "cover",
                  objectPosition: `${posX}% ${posY}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--kov-steel)" }}>
                Format
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isPending}
                    onClick={() => onRatioChange(r)}
                    className="px-2 py-2 text-xs uppercase tracking-widest border transition-colors disabled:opacity-50"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      borderColor: ratio === r ? "var(--kov-red)" : "var(--kov-border)",
                      background: ratio === r ? "var(--kov-red)" : "transparent",
                      color: ratio === r ? "var(--kov-white)" : "var(--kov-bone)",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-xs" style={{ color: "var(--kov-steel)" }}>
              <span className="uppercase tracking-widest">Position horizontale</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={posX}
                disabled={isPending}
                onChange={(e) => onPosXChange(Number(e.target.value))}
                className="w-full disabled:opacity-50"
                style={{ accentColor: "var(--kov-red)" }}
              />
            </label>

            <label className="flex flex-col gap-2 text-xs" style={{ color: "var(--kov-steel)" }}>
              <span className="uppercase tracking-widest">Position verticale</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={posY}
                disabled={isPending}
                onChange={(e) => onPosYChange(Number(e.target.value))}
                className="w-full disabled:opacity-50"
                style={{ accentColor: "var(--kov-red)" }}
              />
            </label>

            <label className="flex flex-col gap-2 text-xs" style={{ color: "var(--kov-steel)" }}>
              <span className="uppercase tracking-widest">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                disabled={isPending}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="w-full disabled:opacity-50"
                style={{ accentColor: "var(--kov-red)" }}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => !isPending && onCancel()}
            disabled={isPending}
            className="px-5 py-2.5 text-xs uppercase tracking-widest border transition-colors disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)", color: "var(--kov-bone)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-5 py-2.5 text-xs uppercase tracking-widest inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)", background: "var(--kov-red)", color: "var(--kov-white)" }}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Traitement…
              </>
            ) : (
              "Confirmer"
            )}
          </button>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
}
