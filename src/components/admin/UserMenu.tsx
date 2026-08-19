"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { logout } from "@/app/login/actions";
import { setOwnOnlineStatus } from "@/app/admin/actions";

export function UserMenu({
  fullName,
  roleLabel,
  isOnline,
}: {
  fullName: string | null;
  roleLabel: string;
  isOnline: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (fullName || "K").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 pl-1 pr-3 py-1.5 text-xs text-kov-bone hover:text-kov-red transition-colors"
      >
        <span
          className="w-8 h-8 flex items-center justify-center text-kov-black text-sm font-medium shrink-0"
          style={{ background: "var(--kov-bone)", borderRadius: "var(--radius-pill)" }}
        >
          {initials}
        </span>
        <span className="text-left leading-tight">
          <span className="block">{fullName || "Admin KOV"}</span>
          <span className="block text-kov-steel text-[10px] uppercase tracking-widest">{roleLabel}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 border py-2"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            borderColor: "var(--glass-border)",
            borderRadius: "var(--radius-glass)",
            boxShadow: "var(--glass-shadow-full)",
          }}
        >
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setOwnOnlineStatus(!isOnline))}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors disabled:opacity-50"
          >
            <span
              className="w-2 h-2 shrink-0"
              style={{ background: isOnline ? "var(--kov-red)" : "var(--kov-steel)", borderRadius: "var(--radius-pill)" }}
            />
            {isOnline ? "En ligne" : "Hors ligne"}
          </button>
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
      )}
    </div>
  );
}
