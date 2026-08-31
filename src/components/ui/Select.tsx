"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  /** Controlled mode: pass both `value` and `onChange`. Uncontrolled mode
   * (matching native `<select defaultValue>` inside a server-rendered
   * `<form action={serverAction}>`): pass `defaultValue` and `name`
   * instead, omit `value`/`onChange` — the component manages its own
   * state and the hidden input carries it on submit, exactly like a real
   * uncontrolled <select>. */
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  options: SelectOption[];
  disabled?: boolean;
  /** Trigger button classes — controls width/padding/text-size, matching the
   * two shapes callers need (compact row-select vs full-width form-field).
   * The glass option list itself is styled internally, not via this prop. */
  className?: string;
  /** Trigger button inline style — for the CSS-custom-property values
   * (border-radius/border-color tokens) every call site in this codebase
   * sets this way rather than via Tailwind arbitrary values. */
  style?: CSSProperties;
  placeholder?: string;
  /** Unlike a native <select>, this is a button, not a form control — it
   * never participates in a parent <form>'s FormData on its own. Passing
   * `name` renders a companion hidden input so `new FormData(form)` and
   * `<form action={serverAction}>` both pick up its value exactly like a
   * real <select name="..."> would. Omit for controlled-only usage (value
   * read straight from onChange, no surrounding form to fill). */
  name?: string;
}

const GLASS_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  boxShadow: "var(--glass-shadow-full)",
} as const;

// KOV-styled replacement for the bare native <select> used throughout the
// admin area — same portal + getBoundingClientRect() + createPortal(body)
// + glass-surface recipe already established by UserMenu/QuickActionMenu/
// NotificationBell (see those for why: a plain "position: absolute"
// dropdown here sits behind other GlassCard content in the browser's
// flattened stacking context). Fixes two real issues native <select> had
// here: the OS-native option-list chrome (light background on some
// browsers/OSes despite `<option className="bg-kov-black">` sprinkled
// inconsistently) and the copy-pasted FIELD_CLASS border-only styling —
// this renders every option itself, so it's consistent everywhere.
export function Select({
  value: controlledValue,
  onChange,
  defaultValue,
  options,
  disabled = false,
  className = "",
  style,
  placeholder,
  name,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlighted, setHighlighted] = useState(0);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  function selectValue(next: string) {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  }

  const selected = options.find((option) => option.value === value);

  function openList() {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    setHighlighted(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${highlighted}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((i) => Math.min(options.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[highlighted];
      if (option) {
        selectValue(option.value);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
        style={style}
      >
        <span className={selected ? "" : "text-kov-steel"}>{selected?.label ?? placeholder ?? "—"}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }} onClick={() => setOpen(false)} />
            <ul
              ref={listRef}
              role="listbox"
              className="fixed border py-1.5 max-h-64 overflow-y-auto"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: "var(--z-modal)",
                borderRadius: "var(--radius-md)",
                ...GLASS_STYLE,
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlighted;
                return (
                  <li key={option.value} data-index={index} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        selectValue(option.value);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setHighlighted(index)}
                      className="w-full text-left px-3 py-2 text-sm transition-colors"
                      style={{
                        color: isSelected ? "var(--kov-red)" : "var(--kov-bone)",
                        background: isHighlighted ? "rgba(255,255,255,0.06)" : "transparent",
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>,
          document.body
        )}
    </>
  );
}
