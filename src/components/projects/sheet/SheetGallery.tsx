"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { ProjectSheetData } from "./sheetData";

// An editorial gallery, not a contact sheet: one wide plate, then a row of
// uprights, and a "+N" tile when there is more than the row can hold.
//
// The lightbox is a second <dialog>. Nesting them works — the top layer is
// a stack, so Escape closes the picture first and the sheet stays open —
// and it means focus trapping and the backdrop come from the platform
// rather than from a second hand-rolled implementation.
export function SheetGallery({ data }: { data: ProjectSheetData }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (data.gallery.length === 0) return null;

  const [lead, ...rest] = data.gallery;
  // Three uprights at most in the row; anything past that is counted on a
  // tile rather than shown, which is what keeps the block editorial.
  const shown = rest.slice(0, 3);
  const overflow = rest.length - shown.length;

  return (
    <section className="ps-gal" aria-label="Visuels du projet">
      <p className="ps-label">Visuels</p>

      <button
        type="button"
        className="ps-gal__lead"
        onClick={() => setOpenIndex(0)}
        aria-label={`Agrandir le visuel 1 sur ${data.gallery.length}`}
      >
        <Image src={lead} alt="" aria-hidden="true" fill sizes="(max-width: 1023px) 92vw, 62vw" className="ps-gal__img" />
      </button>

      {shown.length > 0 && (
        <ul className="ps-gal__row">
          {shown.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setOpenIndex(index + 1)}
                aria-label={`Agrandir le visuel ${index + 2} sur ${data.gallery.length}`}
              >
                <Image src={src} alt="" aria-hidden="true" fill sizes="220px" className="ps-gal__img" />
              </button>
            </li>
          ))}

          {overflow > 0 && (
            <li>
              <button type="button" className="ps-gal__more" onClick={() => setOpenIndex(shown.length + 1)}>
                <span>+{overflow}</span>
                <span className="ps-gal__moreLabel">visuels</span>
              </button>
            </li>
          )}
        </ul>
      )}

      {openIndex !== null && (
        <Lightbox
          images={data.gallery}
          index={openIndex}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: readonly string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  // Arrow keys, because a full-screen picture viewer that only responds to
  // the mouse is half a viewer. The dialog already owns Escape.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (event.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndex]);

  const onBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  return (
    <dialog
      ref={dialogRef}
      className="ps-box"
      onClose={onClose}
      onClick={onBackdrop}
      aria-label={`Visuel ${index + 1} sur ${images.length}`}
      // Same reason as the sheet: a stopped Lenis cancels every wheel
      // event on the page, including the ones over this.
      data-lenis-prevent
    >
      <button type="button" className="ps-box__close" onClick={onClose} aria-label="Fermer le visuel">
        <X size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>

      <div className="ps-box__frame">
        <Image
          src={images[index]}
          alt=""
          aria-hidden="true"
          fill
          sizes="92vw"
          className="ps-box__img"
        />
      </div>

      {images.length > 1 && (
        <p className="ps-box__count">
          {String(index + 1).padStart(2, "0")}
          <span aria-hidden="true"> / </span>
          {String(images.length).padStart(2, "0")}
        </p>
      )}
    </dialog>
  );
}
