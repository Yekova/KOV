"use client";

import { useState } from "react";
import type { FaqItem } from "@/data/faq";

// Native <details> (the previous version) snaps open/closed with no
// transition — this animates smoothly via the CSS grid-template-rows
// 0fr→1fr trick (an inner overflow-hidden wrapper, no JS height
// measurement needed, works for arbitrary/variable content height).
//
// `index` is the item's position within whatever list currently renders it
// (a category group, or a flat filtered/search list) — purely decorative
// ordering, not an id, so the badge is aria-hidden and resets to 01 per
// list rather than trying to track a single global number.
export function FaqAccordionItem({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={open ? "border px-5 py-5 md:px-6 md:py-6 my-2" : "border-b border-t-0 border-x-0 py-6"}
      style={{
        borderColor: "var(--kov-border)",
        background: open ? "var(--kov-carbon)" : "transparent",
        borderRadius: open ? "var(--radius-md)" : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
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
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="mt-4 pl-11 max-w-2xl text-kov-concrete text-sm leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}
