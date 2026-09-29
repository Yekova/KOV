"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { resendClientInvitation } from "@/app/admin/clients/actions";

// Le lien d'accès, toujours récupérable.
//
// Un email peut être accepté par le serveur du destinataire puis jeté sans
// jamais apparaître nulle part. Constaté sur ce projet : trois invitations
// marquées « delivered » par Resend, introuvables dans la boîte, les
// indésirables ET la quarantaine. L'envoi ne signale alors aucune erreur,
// donc rien ne prévient — ni le client, ni le studio.
//
// Ce panneau existe pour que ça cesse d'être un cul-de-sac : quoi qu'il
// arrive au mail, on peut récupérer le lien et le transmettre autrement.
// Aucune configuration DNS n'élimine complètement le filtrage silencieux ;
// un chemin manuel qui ne dépend d'aucun serveur de messagerie, si.
//
// Le lien n'est PAS affiché d'emblée : il ouvre un accès au compte de
// quelqu'un, il n'a rien à faire en permanence sur une page qu'on laisse
// ouverte. Il apparaît quand on le demande.
export function InvitationPanel({ clientId, email }: { clientId: string; email: string | null }) {
  const [invite, setInvite] = useState<{ link: string; emailSent: boolean; emailError: string | null } | null>(null);

  const action = useKovAction({
    fallbackError: "Le renvoi de l'invitation a échoué.",
  });

  function send() {
    action.run(async () => {
      const result = await resendClientInvitation(clientId);
      if (result.error) throw new Error(result.error);
      setInvite({
        link: result.link ?? "",
        emailSent: result.emailSent ?? false,
        emailError: result.emailError ?? null,
      });
      if (result.emailSent) toast.success("Invitation renvoyée.");
      else toast.error("L'email n'est pas parti — le lien est affiché ci-dessous.");
    });
  }

  if (!email) {
    return <p className="text-kov-steel text-sm">Ce client n&apos;a pas d&apos;adresse email : aucune invitation possible.</p>;
  }

  return (
    <div>
      <p className="text-kov-steel text-sm max-w-xl leading-relaxed">
        Renvoie l&apos;email d&apos;invitation à <span className="text-kov-bone">{email}</span> et affiche le lien
        d&apos;activation, pour pouvoir le transmettre autrement si le mail n&apos;arrive pas.
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <KovActionButton
          state={action.state}
          onStateSettled={action.reset}
          type="button"
          variant="secondary"
          onClick={send}
          successLabel="Envoyée"
        >
          Renvoyer l&apos;invitation
        </KovActionButton>
        {action.error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {action.error}
          </p>
        )}
      </div>

      {invite && (
        <div className="mt-5">
          <p className="text-xs" style={{ color: invite.emailSent ? "var(--kov-steel)" : "var(--kov-red)" }}>
            {invite.emailSent
              ? "L'email est parti. Si le client ne le voit pas, transmettez-lui ce lien directement."
              : `L'email n'est pas parti${invite.emailError ? ` : ${invite.emailError}` : ""}. Transmettez ce lien.`}
          </p>

          <div
            className="mt-2 p-3 text-xs text-kov-bone break-all"
            style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
          >
            {invite.link}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(invite.link).then(
                  () => toast.success("Lien copié"),
                  () => toast.error("La copie a échoué — sélectionnez le lien à la main.")
                );
              }}
              className="border px-3 py-2 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              Copier le lien
            </button>
            <button
              type="button"
              onClick={() => setInvite(null)}
              className="text-xs text-kov-steel underline-offset-4 transition-colors hover:text-kov-bone hover:underline"
            >
              Masquer
            </button>
          </div>

          <p className="text-kov-steel text-xs mt-3">
            Lien à usage unique et limité dans le temps. Passé ce délai, le client peut passer par « mot de passe
            oublié » depuis la page de connexion.
          </p>
        </div>
      )}
    </div>
  );
}
