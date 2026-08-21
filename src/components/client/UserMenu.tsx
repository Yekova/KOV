"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { logout } from "@/app/login/actions";

export function UserMenu({ fullName, avatarUrl }: { fullName: string | null; avatarUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  // Portaled to document.body — same "cursor lands underneath" bug fixed
  // elsewhere: a plain absolute dropdown here sits behind GlassCard content
  // on the page in the flattened stacking context, so hover/click misses it.
  function toggle() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const initials = (fullName || "K").trim().charAt(0).toUpperCase();

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        className="flex items-center gap-3 pl-1 pr-3 py-1.5 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors"
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-kov-black text-sm font-medium overflow-hidden shrink-0"
          style={{ background: "var(--kov-bone)", borderRadius: "var(--radius-pill)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span>Bonjour{fullName ? `, ${fullName.split(" ")[0]}` : ""}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-48 border py-2"
              style={{
                top: position.top,
                right: position.right,
                zIndex: "var(--z-modal)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                borderColor: "var(--glass-border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--glass-shadow-full)",
              }}
            >
              <Link
                href="/client/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors"
              >
                Mon profil
              </Link>
              <div className="border-t my-1" style={{ borderColor: "var(--glass-border)" }} />
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
