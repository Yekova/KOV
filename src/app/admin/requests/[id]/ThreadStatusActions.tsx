"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setRequestThreadStatus } from "@/app/admin/requests/actions";

export function ThreadStatusActions({ threadId, status }: { threadId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: "closed" | "open") {
    startTransition(async () => {
      const result = await setRequestThreadStatus(threadId, next);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(next === "closed" ? "Demande clôturée." : "Demande rouverte.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => change(status === "closed" ? "open" : "closed")}
      className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone hover:border-kov-red transition-colors disabled:opacity-50 shrink-0"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      {pending ? "…" : status === "closed" ? "Rouvrir la demande" : "Clôturer la demande"}
    </button>
  );
}
