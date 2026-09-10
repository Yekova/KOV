"use client";

import { useState, type ReactNode } from "react";

interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  number: string;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}

function AccordionItem({ section }: { section: LegalSection }) {
  // Open by default (matches the reference: every article shown expanded
  // on arrival) — the chevron lets a reader collapse an article they've
  // already read, not "open the document" from a fully-closed state.
  const [open, setOpen] = useState(true);

  return (
    <div className="py-6" style={{ borderTop: "1px solid var(--glass-border)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <h2 className="font-display text-kov-bone uppercase text-sm tracking-wide">{section.title}</h2>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--kov-steel)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="mt-4 max-w-2xl text-kov-concrete text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p]:mb-3 [&_p:last-child]:mb-0">
          {section.body}
        </div>
      )}
    </div>
  );
}

// The hub's main panel — one glass card holding the document's own header
// (number, title, last-updated, a real print/save-as-PDF trigger) and its
// articles as a simple expand/collapse list, all open on arrival. No
// separate in-page table-of-contents or parallax grid backdrop anymore —
// both belonged to the old single-column LegalDoc layout this replaces;
// the hub's own sidebar (LegalSidebar) is the real navigation now.
export function LegalDocument({ number, title, updated, intro, sections }: LegalDocumentProps) {
  return (
    <div
      className="p-8 md:p-12"
      style={{
        borderRadius: 24,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <p className="font-mono text-xs text-kov-red flex items-center gap-3">
          {number}
          <span aria-hidden="true" className="w-6 h-px" style={{ background: "var(--kov-red)" }} />
        </p>
        <div className="flex items-center gap-4">
          <p className="text-kov-steel text-[10px] uppercase tracking-widest text-right leading-relaxed">
            Dernière mise à jour
            <br />
            {updated}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Imprimer ou enregistrer ce document en PDF"
            title="Imprimer / enregistrer en PDF"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-kov-bone hover:text-kov-red transition-colors"
            style={{ border: "1px solid var(--glass-border)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <h1
        className="mt-5 font-display text-kov-bone uppercase"
        style={{ fontSize: "clamp(26px, 2.6vw, 40px)", lineHeight: "var(--line-height-display)" }}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-kov-steel text-sm leading-relaxed">{intro}</p>

      <div className="mt-10">
        {sections.map((section) => (
          <AccordionItem key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
