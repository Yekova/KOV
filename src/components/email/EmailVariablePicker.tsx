"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { VARIABLE_CATALOG } from "@/lib/email/variables";

// The "[+ Variable]" menu (spec section 7) — clicking an entry inserts
// {{key}} at the editor's cursor. Never asks the user to type a variable
// by hand.
export function EmailVariablePicker({ onSelect }: { onSelect: (key: string) => void }) {
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
    if (rect) setPosition({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 text-xs uppercase tracking-widest transition-colors"
        style={{ color: "var(--kov-steel)", borderRadius: "var(--radius-sm)" }}
      >
        <Plus size={13} /> Variable
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-72 max-h-96 overflow-y-auto py-2"
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
            {VARIABLE_CATALOG.map((category) => (
              <div key={category.key} className="mb-1 last:mb-0">
                <p className="px-4 py-1 text-[10px] uppercase tracking-widest text-kov-steel">{category.label}</p>
                {category.variables.map((variable) => (
                  <button
                    key={variable.key}
                    type="button"
                    onClick={() => {
                      onSelect(variable.key);
                      setOpen(false);
                    }}
                    title={variable.description}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-kov-bone hover:bg-white/5 transition-colors text-left"
                  >
                    <span>{variable.label}</span>
                    <span className="text-kov-steel text-[10px] font-mono">{`{{${variable.key}}}`}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
