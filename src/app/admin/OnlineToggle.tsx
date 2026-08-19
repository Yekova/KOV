"use client";

import { useTransition } from "react";
import { setOwnOnlineStatus } from "./actions";

export function OnlineToggle({ isOnline }: { isOnline: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setOwnOnlineStatus(!isOnline))}
      className="flex items-center gap-2 text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-50"
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: isOnline ? "var(--kov-red)" : "var(--kov-steel)", borderRadius: "var(--radius-pill)" }}
      />
      {isOnline ? "En ligne" : "Hors ligne"}
    </button>
  );
}
