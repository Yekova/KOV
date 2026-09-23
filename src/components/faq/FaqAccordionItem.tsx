"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { faqAnchor, type FaqItem } from "@/data/faq";

// Native <details> (the previous version) snaps open/closed with no
// transition — this animates smoothly via the CSS grid-template-rows
// 0fr→1fr trick (an inner overflow-hidden wrapper, no JS height
// measurement needed, works for arbitrary/variable content height).
//
// The answer is always in the DOM, hidden by a collapsed grid row rather
// than unmounted, which is what makes it indexable while closed. That was
// already true; what is new is that it now has an address.
//
// `index` is the item's position within whatever list currently renders it
// (a category group, or a flat filtered/search list) — purely decorative
// ordering, not an id, so the badge is aria-hidden and resets to 01 per
// list rather than trying to track a single global number.

// The URL fragment, read the way a browser value should be read from React.
//
// useSyncExternalStore rather than useState plus an effect: the server has
// no location, the fragment is never sent to it anyway, and setting state
// from an effect is both a hydration hazard and the exact thing the
// compiler's set-state-in-effect rule forbids. An empty server snapshot
// means every item renders closed in the HTML, which is correct, and the
// targeted one opens on the client's first real pass.
const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const getHash = () => window.location.hash;
const getServerHash = () => "";

export function FaqAccordionItem({ item, index }: { item: FaqItem; index: number }) {
  const anchor = faqAnchor(item.question);
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  // null means "nobody has touched this one", so the fragment decides.
  const [manual, setManual] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const open = manual ?? hash === `#${anchor}`;

  const copyLink = useCallback(() => {
    const url = `${window.location.origin}/faq#${anchor}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [anchor]);

  return (
    <div
      id={anchor}
      // Clears the sticky header when the browser jumps to this fragment.
      className={`scroll-mt-28 ${open ? "border px-5 py-5 md:px-6 md:py-6 my-2" : "border-b border-t-0 border-x-0 py-6"}`}
      style={{
        borderColor: "var(--kov-border)",
        background: open ? "var(--kov-carbon)" : "transparent",
        borderRadius: open ? "var(--radius-md)" : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setManual(!open)}
        aria-expanded={open}
        aria-controls={`${anchor}-answer`}
        className="w-full flex items-center gap-4 text-left"
      >
        <span
          aria-hidden="true"
          className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-mono"
          style={{ background: "rgba(227, 30, 36, 0.12)", color: "var(--kov-red)" }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <span className="flex-1 font-display text-kov-bone uppercase text-base md:text-lg">{item.question}</span>
        <span
          aria-hidden="true"
          className="w-5 h-5 shrink-0 flex items-center justify-center text-kov-red text-xl leading-none"
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        id={`${anchor}-answer`}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="mt-4 pl-11 max-w-2xl text-kov-concrete text-sm leading-relaxed">{item.answer}</p>
          {open && (
            <div className="mt-4 pl-11">
              <button
                type="button"
                onClick={copyLink}
                className="text-[11px] uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors"
              >
                {copied ? "Lien copié" : "Copier le lien de cette réponse"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
