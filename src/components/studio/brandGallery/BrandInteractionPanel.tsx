"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Brand } from "@/lib/studio/brands";
import { trackGallery } from "@/lib/studio/galleryAnalytics";

/** What sits under the name. The site the stand points at, which is real
 *  information the visitor can check — never the tier, which is an
 *  internal capability and reads as a rank in public. */
export function brandSubtitle(brand: Brand): string | null {
  if (brand.isHouse) return "Le studio";
  if (!brand.websiteUrl) return null;
  try {
    return new URL(brand.websiteUrl).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// The card that opens when a stand is activated.
//
// Deliberately not a modal: no backdrop, no focus trap, no locking of the
// room behind it. It is a panel at the side of a gallery you are standing
// in, and the visitor stays in charge — Escape closes it, and so does
// walking away, because the caller drops it when proximity is lost.
export function BrandInteractionPanel({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      className="absolute bottom-24 left-6 w-[min(360px,86vw)] p-5 pointer-events-auto"
      style={{
        zIndex: "var(--z-nav)",
        border: "1px solid var(--kov-border)",
        borderRadius: "var(--radius-glass)",
        background: "rgba(8,8,9,0.86)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        // With a cover on it the card is tall. On a short window it
        // scrolls rather than running off the top of the room.
        maxHeight: "calc(100vh - 190px)",
        overflowY: "auto",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* A box wide enough for a wordmark and tall enough for a
              monogram, with the mark contained and pinned left — the two
              shapes a brand mark comes in, neither of them stretched. */}
          {brand.logoUrl && (
            <span className="relative shrink-0" style={{ width: 104, height: 30 }}>
              <Image
                src={brand.logoUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="104px"
                style={{ objectFit: "contain", objectPosition: "left center" }}
              />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: 15, color: "var(--kov-bone)" }}>
              {brand.name}
            </p>
            {brandSubtitle(brand) && (
              <p
                className="font-mono"
                style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--kov-steel)" }}
              >
                {brandSubtitle(brand)}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="shrink-0 font-mono"
          style={{ fontSize: 14, lineHeight: 1, color: "var(--kov-steel)", cursor: "pointer" }}
        >
          ×
        </button>
      </div>

      {/* The picture the stand is showing, at the top of the card. The
          same asset the panel in the room carries, so the card is that
          stand rather than a text entry about it. */}
      {brand.coverUrl && (
        <span
          className="relative block mt-4 overflow-hidden"
          style={{ aspectRatio: "16 / 9", borderRadius: 8, border: "1px solid var(--kov-border)" }}
        >
          <Image src={brand.coverUrl} alt="" aria-hidden="true" fill sizes="360px" style={{ objectFit: "cover" }} />
        </span>
      )}

      {/* Plain text, always. A description is a string from a row, and a
          row is data someone typed — it is never rendered as markup. */}
      {brand.description && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--kov-concrete)" }}>
          {brand.description}
        </p>
      )}

      {brand.websiteUrl && (
        <a
          href={brand.websiteUrl}
          target="_blank"
          // noopener because the opened page gets window.opener otherwise,
          // and this URL comes from a row rather than from us.
          rel="noopener noreferrer"
          onClick={() => trackGallery("brand_cta_click", { room_id: "p04", slot_id: brand.slotId, brand_id: brand.id, tier: brand.tier })}
          className="inline-flex items-center gap-2 mt-5 px-4 py-3 font-mono"
          style={{
            border: "1px solid rgba(227,30,36,0.5)",
            borderRadius: 6,
            background: "rgba(227,30,36,0.12)",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--kov-bone)",
          }}
        >
          Découvrir la marque
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </aside>
  );
}
