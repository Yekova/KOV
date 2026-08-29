"use client";

import { useState } from "react";
import type { FaqItem } from "@/data/faq";

// Native <details> (the previous version) snaps open/closed with no
// transition — this animates smoothly via the CSS grid-template-rows
// 0fr→1fr trick (an inner overflow-hidden wrapper, no JS height
// measurement needed, works for arbitrary/variable content height).
export function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b py-6" style={{ borderColor: "var(--kov-border)" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="font-display text-kov-bone uppercase text-base md:text-lg">{item.question}</span>
        <span
          aria-hidden="true"
          className="w-5 h-5 shrink-0 flex items-center justify-center text-kov-red text-xl leading-none transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="mt-4 max-w-2xl text-kov-concrete text-sm leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}
