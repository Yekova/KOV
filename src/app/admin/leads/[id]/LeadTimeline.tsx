import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getLeadInteractions } from "../actions";

// La chronologie d'un lead.
//
// lead_interactions est alimentée à chaque changement de statut, chaque
// email envoyé et chaque soumission de formulaire depuis sa création — et
// n'était lue nulle part, sauf par un count() dans le calcul du score. Une
// histoire complète dormait en base sans avoir jamais été montrée.
//
// Composant serveur : il n'y a rien à modifier ici, seulement un journal à
// lire.

const TYPE_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Appel",
  meeting: "Rendez-vous",
  note: "Note",
  form: "Formulaire",
  proposal: "Devis",
  follow_up: "Relance",
  status_change: "Statut",
};

export async function LeadTimeline({ leadId }: { leadId: string }) {
  const interactions = await getLeadInteractions(leadId);

  if (interactions.length === 0) {
    return (
      <p className="text-kov-steel text-sm">
        Rien d&apos;enregistré pour l&apos;instant. Les changements de statut, les emails et les devis
        s&apos;inscriront ici.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {interactions.map((entry, index) => (
        <li key={entry.id} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full mt-2"
              style={{ background: index === 0 ? "var(--kov-red)" : "var(--kov-border)" }}
            />
            {index < interactions.length - 1 && (
              <span aria-hidden="true" className="w-px flex-1 my-1" style={{ background: "var(--kov-border)" }} />
            )}
          </div>
          <div className="pb-5 min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-kov-bone text-sm">{TYPE_LABELS[entry.type] ?? entry.type}</p>
              <p className="text-kov-steel text-xs">{formatRelativeTime(entry.createdAt)}</p>
            </div>
            {entry.content && <p className="text-kov-concrete text-xs mt-0.5">{entry.content}</p>}
            {entry.actorName && <p className="text-kov-steel text-[11px] mt-0.5">{entry.actorName}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
