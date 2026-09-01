"use client";

import { useState } from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmailComposer } from "./EmailComposer";
import { EmailHistory } from "./EmailHistory";

// Owns the composer's open/closed state and a refresh counter so the
// history list re-fetches right after a send closes the composer, without
// a full page reload.
export function LeadEmailPanel({ leadId }: { leadId: string }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerCategory, setComposerCategory] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  function openComposer(category?: string) {
    setComposerCategory(category);
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" onClick={() => openComposer()}>
          <Send size={14} /> Envoyer un email
        </Button>
        <Button type="button" variant="secondary" onClick={() => openComposer("relance")}>
          <RotateCcw size={14} /> Relancer
        </Button>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-3">Emails</h2>
        <EmailHistory leadId={leadId} refreshKey={refreshKey} />
      </div>

      {composerOpen && <EmailComposer leadId={leadId} onClose={closeComposer} initialCategory={composerCategory} />}
    </div>
  );
}
