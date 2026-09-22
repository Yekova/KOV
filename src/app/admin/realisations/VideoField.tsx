"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { createShowcaseUploadUrl } from "./actions";

const BUCKET = "portal-assets";
/** A ceiling, and a soft one: the file is served from your own storage on
 *  every play, so this is a bandwidth decision rather than a technical
 *  limit. Well above what a thirty-second project film needs at 1080p. */
const MAX_BYTES = 50 * 1024 * 1024;

export interface VideoValue {
  path: string;
  poster: string;
  width: number | null;
  height: number | null;
  duration: string;
}

/** mm:ss, which is what the thumbnail prints. */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Everything the sheet needs that nobody should have to type.
 *
 *  SheetVideo reserves its frame from width and height before a byte of the
 *  film loads, and shows a poster until someone presses play. Asking an
 *  admin for three numbers and a still image would be asking them to be
 *  right about something only the file knows — so the file is asked
 *  instead: an offscreen <video> reports its own dimensions and duration,
 *  and a seek plus a canvas draw produces the poster. Same technique
 *  ImageCropModal already uses for images. */
function inspect(file: File): Promise<{ width: number; height: number; duration: string; poster: Blob | null }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fichier vidéo illisible."));
    };
    video.onerror = fail;

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = formatDuration(video.duration);
      if (!width || !height) return fail();

      // A frame far enough in to be the film rather than a fade from black,
      // but not past the end of a very short one.
      video.currentTime = Math.min(1.5, video.duration * 0.25);
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(url);
          resolve({ width, height, duration, poster: null });
          return;
        }
        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve({ width, height, duration, poster: blob });
          },
          "image/webp",
          0.85
        );
      };
    };
  });
}

// The film, uploaded straight to storage.
//
// Not through a Server Action, and that is the whole reason this component
// exists rather than another ImagePicker: an action body is capped at 10 MB
// by next.config (less again on some Vercel plans), which no real video
// clears. The action here hands back a one-shot signed URL and the browser
// writes the object itself — see createShowcaseUploadUrl on why that does
// not widen the bucket.
export function VideoField({
  projectId,
  value,
  onChange,
}: {
  /** Needed for the deterministic storage path, so replacing a film
   *  overwrites it rather than orphaning the last one. */
  projectId: string | null;
  value: VideoValue;
  onChange: (value: VideoValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function put(kind: "video" | "poster", file: File | Blob, extension: string) {
    if (!projectId) throw new Error("Enregistrez la réalisation avant d'ajouter une vidéo.");
    const { path, token, error: urlError } = await createShowcaseUploadUrl(projectId, kind, extension);
    if (urlError || !path || !token) throw new Error(urlError ?? "Téléversement impossible.");

    const supabase = createBrowserSupabaseClient();
    const { error: uploadError } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file);
    if (uploadError) throw new Error("Le téléversement a échoué.");
    return path;
  }

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("video/")) {
      setError("Le fichier doit être une vidéo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo — 50 Mo maximum).`);
      return;
    }

    try {
      setBusy("Lecture du fichier…");
      const { width, height, duration, poster } = await inspect(file);

      setBusy("Téléversement de la vidéo…");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const videoPath = await put("video", file, extension);

      let posterPath = value.poster;
      if (poster) {
        setBusy("Téléversement de l'affiche…");
        posterPath = await put("poster", poster, "webp");
      }

      onChange({ path: videoPath, poster: posterPath, width, height, duration });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le téléversement a échoué.");
    } finally {
      setBusy(null);
    }
  }

  const hasVideo = Boolean(value.path);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-kov-steel">Vidéo du projet</p>

      <div
        className="mt-2 border border-dashed p-4"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        {hasVideo ? (
          <div className="space-y-2">
            <p className="text-kov-bone text-sm break-all">{value.path}</p>
            <p className="text-kov-steel text-xs">
              {value.width && value.height ? `${value.width} × ${value.height}` : "Dimensions inconnues"}
              {value.duration ? ` · ${value.duration}` : ""}
              {value.poster ? " · affiche générée" : " · sans affiche"}
            </p>
            <button
              type="button"
              onClick={() => onChange({ path: "", poster: "", width: null, height: null, duration: "" })}
              className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors"
            >
              Retirer la vidéo
            </button>
          </div>
        ) : (
          <p className="text-kov-steel text-xs leading-relaxed">
            MP4 ou WebM, 50 Mo maximum. Les dimensions, la durée et l&apos;affiche sont lues dans le fichier —
            rien à saisir.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={busy !== null || !projectId}
          onClick={() => inputRef.current?.click()}
          className="mt-3 border px-3 py-2 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          {busy ?? (hasVideo ? "Remplacer la vidéo" : "Choisir une vidéo")}
        </button>

        {!projectId && (
          <p className="mt-2 text-kov-steel text-xs">
            Enregistrez d&apos;abord la réalisation : le fichier est rangé sous son identifiant.
          </p>
        )}
        {error && <p className="mt-2 text-kov-red text-xs">{error}</p>}
      </div>
    </div>
  );
}
