"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Link2, Printer } from "lucide-react";
import { toast } from "sonner";

// lucide-react ships no brand glyphs — same inline-SVG convention as
// src/components/layout/Footer.tsx's social row, paths reused verbatim.
function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4v13h-4V8zM8.5 8h3.83v1.78h.05c.53-1 1.85-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.16V21h-4v-6.3c0-1.5-.03-3.44-2.1-3.44-2.1 0-2.42 1.64-2.42 3.33V21h-4V8z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.6 10.4 20.4 2.5h-1.7l-5.9 6.9-4.8-6.9H2l7.2 10.3L2 21.5h1.7l6.3-7.3 5 7.3H21zm-2.2 2.6-.7-1-5.8-8.3H7.3l4.7 6.7.7 1 6.1 8.7h-2.5z" />
    </svg>
  );
}

export function ShareMenu({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleOpen() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + window.scrollY + 8, left: rect.right + window.scrollX - 220 });
    }
    setOpen((v) => !v);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
    setOpen(false);
  }

  function handleLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setOpen(false);
  }

  function handlePrint() {
    window.print();
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label="Partager cet article"
        aria-expanded={open}
        className="w-10 h-10 flex items-center justify-center transition-colors"
        style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-pill)" }}
      >
        <Share2 size={16} strokeWidth={1.5} className="text-kov-bone" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-56 py-2"
            style={{
              top: position.top,
              left: position.left,
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              backdropFilter: "var(--glass-blur)",
              boxShadow: "var(--glass-shadow-full)",
              zIndex: "var(--z-modal)" as unknown as number,
            }}
          >
            <button type="button" onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left">
              <Link2 size={15} strokeWidth={1.5} />
              Copier le lien
            </button>
            <button type="button" onClick={handleLinkedIn} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left">
              <LinkedInIcon />
              Partager sur LinkedIn
            </button>
            <button type="button" onClick={handleTwitter} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left">
              <XIcon />
              Partager sur X
            </button>
            <button type="button" onClick={handlePrint} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left">
              <Printer size={15} strokeWidth={1.5} />
              Imprimer
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
