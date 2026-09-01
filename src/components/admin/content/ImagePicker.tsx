"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { Scissors, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImageCropModal, type CropRatio } from "./ImageCropModal";

interface ImagePickerProps {
  /** Current image URL, "" if none. */
  value: string;
  onChange: (url: string) => void;
  /** Validation error message to display, if any. */
  error?: string;
}

interface CropSource {
  url: string;
  /** true for a blob: URL from a local File (createObjectURL); false for a
   * remote http(s) URL pasted by the admin — the crop modal needs to know
   * which, to decide how to (re-)fetch the bytes for the final canvas draw. */
  isLocal: boolean;
}

const DEFAULT_CROP_STATE = { ratio: "16/9" as CropRatio, posX: 50, posY: 50, zoom: 1 };

export function ImagePicker({ value, onChange, error }: ImagePickerProps) {
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [ratio, setRatio] = useState<CropRatio>(DEFAULT_CROP_STATE.ratio);
  const [posX, setPosX] = useState(DEFAULT_CROP_STATE.posX);
  const [posY, setPosY] = useState(DEFAULT_CROP_STATE.posY);
  const [zoom, setZoom] = useState(DEFAULT_CROP_STATE.zoom);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCropForFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image.");
      return;
    }
    setRatio(DEFAULT_CROP_STATE.ratio);
    setPosX(DEFAULT_CROP_STATE.posX);
    setPosY(DEFAULT_CROP_STATE.posY);
    setZoom(DEFAULT_CROP_STATE.zoom);
    setCropSource({ url: URL.createObjectURL(file), isLocal: true });
  }

  function openCropForRemoteUrl() {
    const trimmed = remoteUrl.trim();
    if (!trimmed) {
      toast.error("Entrez une URL d'image.");
      return;
    }
    setRatio(DEFAULT_CROP_STATE.ratio);
    setPosX(DEFAULT_CROP_STATE.posX);
    setPosY(DEFAULT_CROP_STATE.posY);
    setZoom(DEFAULT_CROP_STATE.zoom);
    setCropSource({ url: trimmed, isLocal: false });
  }

  function closeCropModal() {
    if (cropSource?.isLocal) URL.revokeObjectURL(cropSource.url);
    setCropSource(null);
  }

  function handleCropConfirm(url: string) {
    onChange(url);
    closeCropModal();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) openCropForFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) openCropForFile(file);
    event.target.value = "";
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={value ? "Changer l'image" : "Choisir une image"}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleDropZoneKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="relative w-full h-48 flex flex-col items-center justify-center overflow-hidden border cursor-pointer transition-colors"
        style={{
          borderColor: isDragging ? "var(--kov-red)" : "var(--kov-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--kov-carbon)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0 flex items-end justify-center pb-3"
              style={{ background: "linear-gradient(to top, rgba(10,10,10,0.8), transparent 55%)" }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 text-xs uppercase tracking-widest transition-colors"
                style={{ background: "var(--kov-red)", color: "var(--kov-white)", borderRadius: "var(--radius-sm)" }}
              >
                Changer
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center" style={{ color: "var(--kov-steel)" }}>
            <Upload size={28} />
            <p className="text-sm">Glissez une image ou cliquez</p>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="image-picker-remote-url"
          className="block text-xs uppercase tracking-widest mb-1.5"
          style={{ color: "var(--kov-steel)" }}
        >
          URL d&apos;une image distante
        </label>
        <div className="flex gap-2">
          <input
            id="image-picker-remote-url"
            type="text"
            value={remoteUrl}
            onChange={(event) => setRemoteUrl(event.target.value)}
            placeholder="https://…"
            className="flex-1 min-w-0 bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
          <button
            type="button"
            onClick={openCropForRemoteUrl}
            className="px-4 py-2 text-xs uppercase tracking-widest border inline-flex items-center gap-2 shrink-0 transition-colors hover:text-kov-red hover:border-kov-red"
            style={{ borderColor: "var(--kov-border)", color: "var(--kov-bone)", borderRadius: "var(--radius-sm)" }}
          >
            <Scissors size={14} />
            Rogner
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--kov-red)" }}>
          {error}
        </p>
      )}

      {cropSource && (
        <ImageCropModal
          source={cropSource.url}
          isLocalSource={cropSource.isLocal}
          ratio={ratio}
          onRatioChange={setRatio}
          posX={posX}
          onPosXChange={setPosX}
          posY={posY}
          onPosYChange={setPosY}
          zoom={zoom}
          onZoomChange={setZoom}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
