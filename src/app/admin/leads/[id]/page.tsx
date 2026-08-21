import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeadStatusSelect } from "../LeadStatusSelect";
import { AssignLeadSelect } from "../AssignLeadSelect";
import { LeadDetailActions } from "./LeadDetailActions";
import { CONTACT_METHOD_LABELS, LEAD_TIMELINE_LABELS, isContactMethod, isLeadTimeline } from "@/lib/admin/status";

export const metadata: Metadata = { title: "Lead — Admin KOV" };

export default async function AdminLeadDetailPage(props: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const { id: leadId } = await props.params;

  const { data: lead } = await supabaseAdmin.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) notFound();

  const { data: adminProfiles } = await supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name");
  const adminOptions = (adminProfiles ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-10">
      <div>
        <Link href="/admin/leads" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Leads
        </Link>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <h1 className="font-display text-kov-bone text-2xl uppercase">{lead.name}</h1>
          <LeadStatusSelect leadId={lead.id} status={lead.status} />
        </div>
        <p className="text-kov-steel text-sm mt-1">
          Reçu le {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t border-b py-6" style={{ borderColor: "var(--kov-border)" }}>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Email</p>
          <a href={`mailto:${lead.email}`} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
            {lead.email}
          </a>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Téléphone</p>
          <p className="text-kov-bone text-sm">{lead.phone || "—"}</p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Entreprise</p>
          <p className="text-kov-bone text-sm">{lead.company || "—"}</p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Type de projet</p>
          <p className="text-kov-bone text-sm">{lead.project_type || "—"}</p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Moyen de contact souhaité</p>
          <p className="text-kov-bone text-sm">
            {(() => {
              const method: string | null = lead.contact_method;
              return method && isContactMethod(method) ? CONTACT_METHOD_LABELS[method] : "—";
            })()}
          </p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Délai</p>
          <p className="text-kov-bone text-sm">
            {(() => {
              const timeline: string | null = lead.timeline;
              return timeline && isLeadTimeline(timeline) ? LEAD_TIMELINE_LABELS[timeline] : "—";
            })()}
          </p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Budget estimé</p>
          <p className="text-kov-bone text-sm">{lead.budget_cents ? `${(lead.budget_cents / 100).toFixed(2)} €` : "—"}</p>
        </div>
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-1">Assigné à</p>
          <AssignLeadSelect leadId={lead.id} assignedTo={lead.assigned_to} admins={adminOptions} />
        </div>
      </div>

      {lead.message && (
        <div>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-2">Message</p>
          <p className="text-kov-bone text-sm whitespace-pre-wrap">{lead.message}</p>
        </div>
      )}

      <LeadDetailActions leadId={lead.id} initialNotes={lead.notes} convertedProfileId={lead.converted_profile_id} />
    </main>
  );
}
