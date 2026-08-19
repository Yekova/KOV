import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Button } from "@/components/ui/Button";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
} from "@/lib/portal/status";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";
import {
  setAccountManager,
  createProject,
  updateProject,
  uploadDocument,
  createInvoice,
  updateInvoiceStatus,
  replyToRequestThread,
} from "../actions";

export const metadata: Metadata = {
  title: "Client — Admin KOV",
};

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export default async function AdminClientDetailPage(props: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id: clientId } = await props.params;

  const { data: client } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, company, account_manager_id, role")
    .eq("id", clientId)
    .maybeSingle();

  if (!client || client.role !== "client") {
    notFound();
  }

  const [{ data: admins }, { data: projects }, { data: documents }, { data: invoices }, { data: threads }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name"),
      supabaseAdmin.from("projects").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabaseAdmin
        .from("documents")
        .select("id, filename, created_at, uploaded_by, project_id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("issued_at", { ascending: false }),
      supabaseAdmin
        .from("request_threads")
        .select("id, subject, status, updated_at")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false }),
    ]);

  const projectRows = projects ?? [];
  const documentRows = documents ?? [];
  const invoiceRows = invoices ?? [];
  const threadRows = threads ?? [];

  let latestMessageByThread = new Map<string, { body: string; created_by: string }>();
  if (threadRows.length) {
    const { data: messages } = await supabaseAdmin
      .from("request_messages")
      .select("thread_id, body, created_by, created_at")
      .in(
        "thread_id",
        threadRows.map((t) => t.id)
      )
      .order("created_at", { ascending: false });
    latestMessageByThread = new Map();
    for (const m of messages ?? []) {
      if (!latestMessageByThread.has(m.thread_id)) {
        latestMessageByThread.set(m.thread_id, { body: m.body, created_by: m.created_by });
      }
    }
  }

  const setAccountManagerWithId = setAccountManager.bind(null, clientId);

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto w-full space-y-16">
      <div>
        <Link href="/admin/clients" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Retour aux clients
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">
          {client.full_name || client.company || client.email}
        </h1>
        <p className="text-kov-steel text-sm mt-1">{client.email}</p>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Chef de projet</h2>
        <form action={setAccountManagerWithId} className="flex items-center gap-4">
          <select
            key={client.account_manager_id ?? "none"}
            name="account_manager_id"
            defaultValue={client.account_manager_id ?? ""}
            className={`${FIELD_CLASS} max-w-xs`}
            style={{ borderColor: "var(--kov-border)" }}
          >
            <option value="">— Aucun —</option>
            {(admins ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name || a.email}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Attribuer
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Projets</h2>

        <div className="space-y-4 mb-8">
          {projectRows.length === 0 && <p className="text-kov-steel text-sm">Aucun projet pour l&apos;instant.</p>}
          {projectRows.map((project) => {
            const updateProjectWithId = updateProject.bind(null, project.id);
            return (
              <form
                key={project.id}
                action={updateProjectWithId}
                className="border p-4 flex flex-wrap items-end gap-4"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              >
                <div>
                  <p className="text-kov-bone text-sm">{project.name}</p>
                  <p className="text-kov-steel text-xs mt-1">{project.category}</p>
                </div>
                <label className="text-xs text-kov-steel">
                  Statut
                  <select name="status" defaultValue={project.status} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {PROJECT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-kov-steel">
                  Étape pipeline
                  <select name="pipeline_stage" defaultValue={project.pipeline_stage} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {PIPELINE_STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-kov-steel">
                  Chef de projet
                  <select name="project_manager_id" defaultValue={project.project_manager_id ?? ""} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                    <option value="">— Aucun —</option>
                    {(admins ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name || a.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-kov-steel">
                  Budget (€)
                  <input
                    type="text"
                    name="budget_eur"
                    defaultValue={project.budget_cents !== null ? (project.budget_cents / 100).toFixed(2) : ""}
                    className={`${FIELD_CLASS} w-28`}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                </label>
                <label className="text-xs text-kov-steel">
                  Priorité
                  <select name="priority" defaultValue={project.priority ?? ""} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                    <option value="">—</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-kov-steel">
                  Avancement %
                  <input
                    type="number"
                    name="progress_percent"
                    min={0}
                    max={100}
                    defaultValue={project.progress_percent}
                    className={`${FIELD_CLASS} w-24`}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                </label>
                <label className="text-xs text-kov-steel">
                  Échéance
                  <input
                    type="date"
                    name="next_deadline_date"
                    defaultValue={project.next_deadline_date ?? ""}
                    className={FIELD_CLASS}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                </label>
                <label className="text-xs text-kov-steel">
                  Phase
                  <input
                    type="text"
                    name="deadline_phase_label"
                    defaultValue={project.deadline_phase_label ?? ""}
                    className={FIELD_CLASS}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                </label>
                <Button type="submit" variant="secondary">
                  Mettre à jour
                </Button>
              </form>
            );
          })}
        </div>

        <form
          action={createProject}
          className="border p-4 flex flex-wrap items-end gap-4"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          <label className="text-xs text-kov-steel">
            Nom
            <input type="text" name="name" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Catégorie
            <input type="text" name="category" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Statut
            <select name="status" defaultValue="in_progress" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-kov-steel">
            Étape pipeline
            <select name="pipeline_stage" defaultValue="discovery" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {PIPELINE_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-kov-steel">
            Chef de projet
            <select name="project_manager_id" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
              <option value="">— Aucun —</option>
              {(admins ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-kov-steel">
            Budget (€)
            <input type="text" name="budget_eur" placeholder="4200.00" className={`${FIELD_CLASS} w-28`} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Priorité
            <select name="priority" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
              <option value="">—</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-kov-steel">
            Échéance
            <input type="date" name="next_deadline_date" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Phase
            <input type="text" name="deadline_phase_label" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <Button type="submit" variant="primary">
            Créer le projet
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Documents</h2>

        <ul className="space-y-2 mb-8">
          {documentRows.length === 0 && <li className="text-kov-steel text-sm">Aucun document.</li>}
          {documentRows.map((doc) => (
            <li key={doc.id} className="text-sm text-kov-bone flex items-center justify-between border-b py-2" style={{ borderColor: "var(--kov-border)" }}>
              <span>{doc.filename}</span>
              <span className="text-kov-steel text-xs">{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
            </li>
          ))}
        </ul>

        <form
          action={uploadDocument}
          className="border p-4 flex flex-wrap items-end gap-4"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          <label className="text-xs text-kov-steel">
            Projet (facultatif)
            <select name="project_id" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
              <option value="">— Aucun —</option>
              {projectRows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-kov-steel">
            Fichier
            <input type="file" name="file" required className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <Button type="submit" variant="primary">
            Téléverser
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Facturation</h2>

        <div className="space-y-2 mb-8">
          {invoiceRows.length === 0 && <p className="text-kov-steel text-sm">Aucune facture.</p>}
          {invoiceRows.map((invoice) => {
            const updateInvoiceStatusWithId = updateInvoiceStatus.bind(null, invoice.id);
            return (
              <form
                key={invoice.id}
                action={updateInvoiceStatusWithId}
                className="flex items-center justify-between gap-4 border-b py-2"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <span className="text-kov-bone text-sm">{invoice.reference}</span>
                <span className="text-kov-steel text-sm">{(invoice.amount_cents / 100).toFixed(2)} €</span>
                <select
                  name="status"
                  defaultValue={invoice.status}
                  className={`${FIELD_CLASS} w-40`}
                  style={{ borderColor: "var(--kov-border)" }}
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INVOICE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="ghost">
                  Mettre à jour
                </Button>
              </form>
            );
          })}
        </div>

        <form
          action={createInvoice}
          className="border p-4 flex flex-wrap items-end gap-4"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        >
          <input type="hidden" name="client_id" value={clientId} />
          <label className="text-xs text-kov-steel">
            Référence
            <input type="text" name="reference" required placeholder="F-2026-01" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Montant (€)
            <input type="text" name="amount_eur" required placeholder="1200.00" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            Échéance
            <input type="date" name="due_at" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <label className="text-xs text-kov-steel">
            PDF (facultatif)
            <input type="file" name="pdf_file" accept="application/pdf" className={`${FIELD_CLASS} py-1.5`} style={{ borderColor: "var(--kov-border)" }} />
          </label>
          <Button type="submit" variant="primary">
            Créer la facture
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Demandes</h2>

        <div className="space-y-4">
          {threadRows.length === 0 && <p className="text-kov-steel text-sm">Aucune demande.</p>}
          {threadRows.map((thread) => {
            const replyWithId = replyToRequestThread.bind(null, thread.id);
            const latest = latestMessageByThread.get(thread.id);
            return (
              <div key={thread.id} className="border p-4" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-kov-bone text-sm">{thread.subject}</p>
                  <span className="text-kov-steel text-xs uppercase tracking-widest">{thread.status}</span>
                </div>
                {latest && (
                  <p className="text-kov-steel text-sm mb-3">
                    {latest.created_by === "client" ? "Client : " : "KOV : "}
                    {latest.body}
                  </p>
                )}
                <form action={replyWithId} className="flex items-end gap-4">
                  <textarea
                    name="body"
                    rows={2}
                    required
                    placeholder="Répondre…"
                    className={`${FIELD_CLASS} flex-1`}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                  <Button type="submit" variant="secondary">
                    Répondre
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
