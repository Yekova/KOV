"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { disconnectMicrosoftAccount } from "@/app/admin/settings/actions";

// "Connecter Outlook" is a plain <a> to a GET route (/api/auth/microsoft/connect),
// not a server action — it has to end in a full-page redirect to
// login.microsoftonline.com, which a server action can't do from client-side
// JS. The connected/error result comes back as ?ms_status=... on this same
// page after the OAuth round-trip.
export function EmailAccountConnection({ connectedEmail }: { connectedEmail: string | null }) {
  const searchParams = useSearchParams();
  const status = searchParams.get("ms_status");
  const message = searchParams.get("ms_message");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="p-4" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-md)", border: "1px solid var(--kov-border)" }}>
      <p className="text-kov-bone text-sm">Boîte mail connectée</p>
      <p className="text-kov-steel text-xs mt-1.5 leading-relaxed">
        Une fois connectée, les emails que vous envoyez depuis le CRM (leads, devis, factures) partent réellement de
        cette boîte — ils apparaissent dans vos éléments envoyés, et les réponses arrivent dans votre vraie boîte de
        réception. Sans connexion, l&apos;envoi continue de passer par l&apos;expéditeur partagé KOV.
      </p>

      {status === "connected" && <p className="text-[#3FB27F] text-xs mt-3">Boîte mail connectée avec succès.</p>}
      {status === "error" && <p className="text-kov-red text-xs mt-3">{message || "La connexion a échoué."}</p>}

      <div className="flex items-center gap-3 mt-4">
        {connectedEmail ? (
          <>
            <span className="text-kov-bone text-sm">{connectedEmail}</span>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => startTransition(() => disconnectMicrosoftAccount())}
            >
              {isPending ? "…" : "Déconnecter"}
            </Button>
          </>
        ) : (
          // A plain <a>, not <Button href>/next/link — this has to be a real
          // full page navigation into a Route Handler that immediately
          // 302s to login.microsoftonline.com, not a client-side transition
          // Next might otherwise try to intercept/prefetch as if it were an
          // app page.
          <a
            href="/api/auth/microsoft/connect"
            className="relative inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors px-6 py-4 border text-kov-bone hover:text-kov-red hover:border-kov-red"
          >
            Connecter Outlook
          </a>
        )}
      </div>
    </div>
  );
}
