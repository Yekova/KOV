import { ACCESS_COLORS, ACCESS_LABELS, type ClientAccess } from "@/lib/clients/access";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { OnboardingState } from "@/lib/clients/onboarding";

// L'état de l'espace d'un client, en une lecture.
//
// Rien ici n'est stocké : le statut, l'invitation, l'activation et la
// dernière connexion sont déduits de auth.users, et l'ouverture de
// l'email vient du journal d'envoi. Cette carte ne peut donc pas être en
// retard sur la réalité — il n'y a pas de copie à rafraîchir.

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-kov-steel text-[10px] tracking-widest uppercase">{label}</span>
      <span className={`text-right text-xs ${muted ? "text-kov-steel" : "text-kov-bone"}`}>{value}</span>
    </div>
  );
}

export function ClientSpacePanel({
  access,
  onboarding,
}: {
  access: ClientAccess;
  onboarding: OnboardingState;
}) {
  const steps: { label: string; at: string | null }[] = [
    { label: "Bienvenue", at: onboarding.welcomeSeenAt },
    { label: "Informations confirmées", at: onboarding.profileVerifiedAt },
    { label: "Mot de passe défini", at: onboarding.securityDoneAt },
    { label: "Projet consulté", at: onboarding.projectSeenAt },
    { label: "Validation consultée", at: onboarding.validationSeenAt },
  ];
  const done = steps.filter((step) => step.at !== null).length;

  return (
    <div className="kov-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] tracking-widest uppercase"
          style={{
            borderRadius: "var(--radius-pill)",
            color: ACCESS_COLORS[access.status],
            border: `1px solid ${ACCESS_COLORS[access.status]}`,
          }}
        >
          {ACCESS_LABELS[access.status]}
        </span>
        <span className="text-kov-steel text-[11px]">
          Parcours d&apos;accueil : {done} / {steps.length}
          {onboarding.completedAt && " · terminé"}
        </span>
      </div>

      <div className="mt-4 divide-y" style={{ borderColor: "var(--kov-border)" }}>
        <Line
          label="Invitation envoyée"
          value={access.invitedAt ? formatRelativeTime(access.invitedAt) : "Jamais"}
          muted={!access.invitedAt}
        />
        {/* Une ouverture non rapportée ne veut PAS dire non lue : beaucoup
            de messageries bloquent le pixel de suivi. La carte le dit,
            plutôt que de laisser conclure à un désintérêt. */}
        <Line
          label="Email ouvert"
          value={access.inviteOpenedAt ? formatRelativeTime(access.inviteOpenedAt) : "Non rapporté"}
          muted={!access.inviteOpenedAt}
        />
        <Line
          label="Compte activé"
          value={access.activatedAt ? formatRelativeTime(access.activatedAt) : "Pas encore"}
          muted={!access.activatedAt}
        />
        <Line
          label="Dernière connexion"
          value={access.lastSignInAt ? formatRelativeTime(access.lastSignInAt) : "Jamais"}
          muted={!access.lastSignInAt}
        />
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {steps.map((step) => (
          <li
            key={step.label}
            className="text-[11px]"
            style={{ color: step.at ? "var(--kov-status-green)" : "var(--kov-steel)" }}
            title={step.at ? formatRelativeTime(step.at) : "Pas encore"}
          >
            {step.at ? "✓" : "○"} {step.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
