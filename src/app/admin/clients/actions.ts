"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isProjectStatus,
  isInvoiceStatus,
  isInvoiceKind,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
  type InvoiceKind,
} from "@/lib/portal/status";
import { uploadClientFile, uploadClientFileBuffer, createSignedDownloadUrl, deleteClientFile } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName, notifyClientOfAdminReply } from "@/lib/activity";
import { isPipelineStage, isPriority } from "@/lib/admin/status";
import { generateInvoicePdfBuffer } from "@/lib/billing/generatePdf";
import { sendEmail } from "@/lib/email/brevo";
import { invoiceEmailHtml, invoiceEmailSubject } from "@/lib/email/invoiceEmail";
import { toDbLineItems, fromDbLineItems, parseLineItemsFromForm } from "@/lib/billing/quoteLineItems";
import { revalidateClient } from "@/lib/revalidateClient";

export async function archiveClient(clientId: string) {
  await requireAdmin();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw new Error("L'archivage a échoué.");

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function unarchiveClient(clientId: string) {
  await requireAdmin();

  const { error } = await supabaseAdmin.from("profiles").update({ archived_at: null }).eq("id", clientId);
  if (error) throw new Error("La réactivation a échoué.");

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function setAccountManager(clientId: string, formData: FormData) {
  const admin = await requireAdmin();

  const adminId = formData.get("account_manager_id");
  const value = typeof adminId === "string" && adminId ? adminId : null;

  const { error } = await supabaseAdmin.from("profiles").update({ account_manager_id: value }).eq("id", clientId);
  if (error) throw new Error("L'attribution a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  const managerName = value ? await getActorDisplayName(value) : null;
  await logActivity({
    clientId,
    type: "milestone",
    title: managerName ? `Chargé de compte : ${managerName}` : "Chargé de compte retiré",
    adminTitle: managerName
      ? `${actorName} a attribué ce client à ${managerName}`
      : `${actorName} a retiré le chargé de compte de ce client`,
    actorId: admin.id,
  });

  revalidateClient(clientId);
}

function parseEuroToCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : null;
}

export async function createProject(formData: FormData) {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const name = formData.get("name");
  const category = formData.get("category");
  const status = formData.get("status");
  const pipelineStage = formData.get("pipeline_stage");
  const progress = formData.get("progress_percent");
  const deadline = formData.get("next_deadline_date");
  const phaseLabel = formData.get("deadline_phase_label");
  const projectManagerId = formData.get("project_manager_id");
  const budget = formData.get("budget_eur");
  const priority = formData.get("priority");
  const description = formData.get("description");

  if (typeof clientId !== "string" || !clientId) throw new Error("Client invalide.");
  if (typeof name !== "string" || !name.trim()) throw new Error("Nom de projet requis.");
  if (typeof category !== "string" || !category.trim()) throw new Error("Catégorie requise.");

  const statusValue = typeof status === "string" && isProjectStatus(status) ? status : "in_progress";
  const pipelineStageValue = typeof pipelineStage === "string" && isPipelineStage(pipelineStage) ? pipelineStage : "discovery";
  const progressValue =
    typeof progress === "string" && progress ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0)) : 0;
  const priorityValue = typeof priority === "string" && isPriority(priority) ? priority : null;

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert({
      client_id: clientId,
      name: name.trim(),
      category: category.trim(),
      status: statusValue,
      pipeline_stage: pipelineStageValue,
      progress_percent: progressValue,
      next_deadline_date: typeof deadline === "string" && deadline ? deadline : null,
      deadline_phase_label: typeof phaseLabel === "string" && phaseLabel.trim() ? phaseLabel.trim() : null,
      project_manager_id: typeof projectManagerId === "string" && projectManagerId ? projectManagerId : null,
      budget_cents: parseEuroToCents(budget),
      priority: priorityValue,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("La création du projet a échoué.");

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: data.id,
    type: "milestone",
    title: "Nouveau projet créé",
    adminTitle: `${actorName} a créé le projet ${name.trim()}`,
    actorId: admin.id,
    description: name.trim(),
  });

  revalidateClient(clientId);
}

export async function updateProject(projectId: string, formData: FormData) {
  const admin = await requireAdmin();

  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("client_id, name, status, progress_percent")
    .eq("id", projectId)
    .maybeSingle();

  if (!existing) throw new Error("Projet introuvable.");

  const status = formData.get("status");
  const pipelineStage = formData.get("pipeline_stage");
  const progress = formData.get("progress_percent");
  const deadline = formData.get("next_deadline_date");
  const phaseLabel = formData.get("deadline_phase_label");
  const projectManagerId = formData.get("project_manager_id");
  const budget = formData.get("budget_eur");
  const priority = formData.get("priority");

  const statusValue: ProjectStatus =
    typeof status === "string" && isProjectStatus(status) ? status : (existing.status as ProjectStatus);
  const progressValue =
    typeof progress === "string" && progress
      ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0))
      : existing.progress_percent;

  const { error } = await supabaseAdmin
    .from("projects")
    .update({
      status: statusValue,
      pipeline_stage: typeof pipelineStage === "string" && isPipelineStage(pipelineStage) ? pipelineStage : undefined,
      progress_percent: progressValue,
      next_deadline_date: typeof deadline === "string" ? deadline || null : undefined,
      deadline_phase_label: typeof phaseLabel === "string" ? phaseLabel.trim() || null : undefined,
      project_manager_id:
        typeof projectManagerId === "string" ? (projectManagerId || null) : undefined,
      budget_cents: budget !== null ? parseEuroToCents(budget) : undefined,
      priority: typeof priority === "string" ? (isPriority(priority) ? priority : null) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw new Error("La mise à jour a échoué.");

  if (statusValue !== existing.status || progressValue !== existing.progress_percent) {
    const actorName = await getActorDisplayName(admin.id);
    const changedStatus = statusValue !== existing.status;

    await logActivity({
      clientId: existing.client_id,
      projectId,
      type: "milestone",
      title: changedStatus ? "Statut de projet mis à jour" : "Avancement mis à jour",
      adminTitle: changedStatus
        ? `${actorName} a mis à jour le statut du projet ${existing.name}`
        : `${actorName} a mis à jour l'avancement du projet ${existing.name}`,
      actorId: admin.id,
      description: `${PROJECT_STATUS_LABELS[statusValue]} — ${progressValue}%`,
    });
  }

  revalidateClient(existing.client_id);
}

// Persists a pipeline drag-and-drop move — called from the dashboard's
// kanban board, distinct from updateProject's fuller form-based update.
export async function updateProjectPipelineStage(projectId: string, stage: string) {
  const admin = await requireAdmin();

  if (!isPipelineStage(stage)) throw new Error("Étape invalide.");

  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("client_id, name, pipeline_stage")
    .eq("id", projectId)
    .maybeSingle();
  if (!existing) throw new Error("Projet introuvable.");

  const { error } = await supabaseAdmin.from("projects").update({ pipeline_stage: stage }).eq("id", projectId);
  if (error) throw new Error("La mise à jour a échoué.");

  if (existing.pipeline_stage !== stage) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: existing.client_id,
      projectId,
      type: "milestone",
      title: "Étape du projet mise à jour",
      adminTitle: `${actorName} a déplacé le projet ${existing.name} dans le pipeline`,
      actorId: admin.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function uploadDocument(formData: FormData) {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const projectId = formData.get("project_id");
  const file = formData.get("file");

  if (typeof clientId !== "string" || !clientId) throw new Error("Client invalide.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier invalide.");

  const documentId = crypto.randomUUID();
  const storagePath = `${clientId}/documents/${documentId}-${file.name}`;
  await uploadClientFile(storagePath, file);

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;

  const { error } = await supabaseAdmin.from("documents").insert({
    id: documentId,
    client_id: clientId,
    project_id: projectIdValue,
    filename: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: admin.id,
  });

  if (error) throw new Error("L'enregistrement du document a échoué.");

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: projectIdValue,
    type: "document",
    title: "Document ajouté",
    adminTitle: `${actorName} a ajouté un nouveau fichier sur ${file.name}`,
    actorId: admin.id,
    description: file.name,
  });

  revalidateClient(clientId);
}

export async function deleteDocument(documentId: string) {
  const admin = await requireAdmin();

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("client_id, project_id, filename, storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) throw new Error("Document introuvable.");

  const { error } = await supabaseAdmin.from("documents").delete().eq("id", documentId);
  if (error) throw new Error("La suppression a échoué.");

  await deleteClientFile(doc.storage_path);

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: doc.client_id,
    projectId: doc.project_id,
    type: "document",
    title: "Document supprimé",
    adminTitle: `${actorName} a supprimé ${doc.filename}`,
    actorId: admin.id,
  });

  revalidateClient(doc.client_id);
}

// Returns { error } instead of throwing for expected/validation failures —
// see convertQuoteToInvoice's own comment (src/app/admin/quotes/actions.ts)
// for why: Next.js 16 redacts thrown Server Action error messages in
// production. Has two callers with different shapes: NewClientInvoiceForm
// (useActionState, client_id bound contextually) and the general billing
// page's NewInvoiceForm (a client_id Select, no context to bind).
export async function createInvoice(formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const projectId = formData.get("project_id");
  const reference = formData.get("reference");
  const amount = formData.get("amount_eur");
  const dueAt = formData.get("due_at");
  const pdfFile = formData.get("pdf_file");
  const kind = formData.get("kind");
  const depositPercent = formData.get("deposit_percent");
  const totalProject = formData.get("total_project_eur");
  const lineItems = parseLineItemsFromForm(formData.get("line_items"));

  if (typeof clientId !== "string" || !clientId) return { error: "Client invalide." };
  if (typeof reference !== "string" || !reference.trim()) return { error: "Référence requise." };

  const amountCents = parseEuroToCents(amount);
  if (amountCents === null) return { error: "Montant invalide." };

  const kindValue: InvoiceKind = typeof kind === "string" && isInvoiceKind(kind) ? kind : "full";
  const depositPercentValue =
    kindValue === "deposit" && typeof depositPercent === "string" && depositPercent
      ? Math.min(100, Math.max(1, parseInt(depositPercent, 10) || 0))
      : null;
  const totalProjectCents = kindValue !== "full" ? parseEuroToCents(totalProject) : null;

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;
  const issuedAt = new Date().toISOString();
  const dueAtValue = typeof dueAt === "string" && dueAt ? new Date(dueAt).toISOString() : null;

  const invoiceId = crypto.randomUUID();
  const pdfPath = `${clientId}/invoices/${invoiceId}.pdf`;

  if (pdfFile instanceof File && pdfFile.size > 0) {
    // Admin supplied their own PDF (e.g. a custom-formatted invoice) — use it
    // as-is instead of generating one from the template. The <input accept>
    // is only a browser hint, so the real type is checked here too.
    if (pdfFile.type !== "application/pdf") return { error: "Le fichier personnalisé doit être un PDF." };
    await uploadClientFile(pdfPath, pdfFile);
  } else {
    const { data: client } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company, email")
      .eq("id", clientId)
      .maybeSingle();
    const { data: project } = projectIdValue
      ? await supabaseAdmin.from("projects").select("name").eq("id", projectIdValue).maybeSingle()
      : { data: null };

    const pdfBuffer = await generateInvoicePdfBuffer({
      reference: reference.trim(),
      issuedAt,
      dueAt: dueAtValue,
      kind: kindValue,
      depositPercent: depositPercentValue,
      totalProjectCents,
      amountCents,
      clientName: client?.full_name || client?.company || client?.email || "Client",
      clientCompany: client?.company ?? null,
      clientEmail: client?.email ?? null,
      projectName: project?.name ?? null,
      lineItems,
    });
    await uploadClientFileBuffer(pdfPath, pdfBuffer, "application/pdf");
  }

  const { error } = await supabaseAdmin.from("invoices").insert({
    id: invoiceId,
    client_id: clientId,
    project_id: projectIdValue,
    reference: reference.trim(),
    amount_cents: amountCents,
    status: "sent",
    pdf_storage_path: pdfPath,
    issued_at: issuedAt,
    due_at: dueAtValue,
    kind: kindValue,
    deposit_percent: depositPercentValue,
    total_project_cents: totalProjectCents,
    line_items: toDbLineItems(lineItems),
  });

  if (error) return { error: "La création de la facture a échoué." };

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: projectIdValue,
    type: "invoice",
    title: "Facture émise",
    adminTitle: `${actorName} a émis la facture ${reference.trim()}`,
    actorId: admin.id,
    description: `Facture ${reference.trim()}`,
  });

  revalidateClient(clientId);
  return { error: null };
}

export async function updateInvoiceStatus(invoiceId: string, formData: FormData) {
  const admin = await requireAdmin();

  const status = formData.get("status");
  if (typeof status !== "string" || !isInvoiceStatus(status)) throw new Error("Statut invalide.");

  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("client_id, project_id, reference, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!existing) throw new Error("Facture introuvable.");

  // Only stamp/clear paid_at on the actual transition — setting now() on
  // every resubmit of an already-paid invoice would clobber the real
  // payment date.
  const becamePaid = existing.status !== "paid" && status === "paid";
  const leftPaid = existing.status === "paid" && status !== "paid";

  const { error } = await supabaseAdmin
    .from("invoices")
    .update({
      status,
      paid_at: becamePaid ? new Date().toISOString() : leftPaid ? null : undefined,
    })
    .eq("id", invoiceId);
  if (error) throw new Error("La mise à jour a échoué.");

  if (becamePaid) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: existing.client_id,
      projectId: existing.project_id,
      type: "invoice",
      title: "Facture payée",
      adminTitle: `${actorName} a marqué la facture ${existing.reference} comme payée`,
      actorId: admin.id,
      description: `Facture ${existing.reference}`,
    });
  }

  revalidateClient(existing.client_id);
}

export async function deleteInvoice(invoiceId: string) {
  const admin = await requireAdmin();

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("client_id, project_id, reference, status, pdf_storage_path")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) throw new Error("Facture introuvable.");
  if (invoice.status === "paid") throw new Error("Une facture payée ne peut pas être supprimée — annulez-la si besoin de la retirer.");

  const { error } = await supabaseAdmin.from("invoices").delete().eq("id", invoiceId);
  if (error) throw new Error("La suppression a échoué.");

  if (invoice.pdf_storage_path) await deleteClientFile(invoice.pdf_storage_path);

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: invoice.client_id,
    projectId: invoice.project_id,
    type: "invoice",
    title: "Facture supprimée",
    adminTitle: `${actorName} a supprimé la facture ${invoice.reference}`,
    actorId: admin.id,
  });

  revalidateClient(invoice.client_id);
}

export async function sendInvoiceEmail(invoiceId: string) {
  const admin = await requireAdmin();

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select(
      "client_id, project_id, reference, amount_cents, kind, deposit_percent, total_project_cents, due_at, issued_at, pdf_storage_path, line_items"
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) throw new Error("Facture introuvable.");

  const { data: client } = await supabaseAdmin
    .from("profiles")
    .select("full_name, company, email")
    .eq("id", invoice.client_id)
    .maybeSingle();
  if (!client?.email) throw new Error("Ce client n'a pas d'adresse email.");

  let projectName: string | null = null;
  if (invoice.project_id) {
    const { data: project } = await supabaseAdmin.from("projects").select("name").eq("id", invoice.project_id).maybeSingle();
    projectName = project?.name ?? null;
  }

  const clientName = client.full_name || client.company || client.email;

  // Never regenerate a PDF that already exists — it may be a custom file the
  // admin uploaded by hand (createInvoice's "PDF personnalisé" field), and
  // clobbering it here previously destroyed that upload silently. Only
  // fall back to generating one for legacy rows that predate auto-generation.
  let pdfPath = invoice.pdf_storage_path;
  let pdfBuffer: Buffer;
  if (pdfPath) {
    const signedUrl = await createSignedDownloadUrl(pdfPath, 60);
    if (!signedUrl) throw new Error("Le PDF existant est introuvable — recréez la facture.");
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error("Le téléchargement du PDF existant a échoué.");
    pdfBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    pdfBuffer = await generateInvoicePdfBuffer({
      reference: invoice.reference,
      issuedAt: invoice.issued_at,
      dueAt: invoice.due_at,
      kind: invoice.kind as "full" | "deposit" | "balance",
      depositPercent: invoice.deposit_percent,
      totalProjectCents: invoice.total_project_cents,
      amountCents: invoice.amount_cents,
      clientName,
      clientCompany: client.company,
      clientEmail: client.email,
      projectName,
      lineItems: fromDbLineItems(invoice.line_items),
    });
    pdfPath = `${invoice.client_id}/invoices/${invoiceId}.pdf`;
    await uploadClientFileBuffer(pdfPath, pdfBuffer, "application/pdf");
  }

  const emailData = {
    clientName,
    reference: invoice.reference,
    kind: invoice.kind as "full" | "deposit" | "balance",
    amountCents: invoice.amount_cents,
    dueAt: invoice.due_at,
    projectName,
  };

  await sendEmail({
    to: client.email,
    toName: clientName,
    subject: invoiceEmailSubject(emailData),
    html: await invoiceEmailHtml(emailData),
    attachments: [{ name: `${invoice.reference}.pdf`, content: pdfBuffer.toString("base64") }],
  });

  const { error } = await supabaseAdmin
    .from("invoices")
    .update({ pdf_storage_path: pdfPath, sent_at: new Date().toISOString() })
    .eq("id", invoiceId);
  if (error) throw new Error("L'enregistrement après envoi a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: invoice.client_id,
    projectId: invoice.project_id,
    type: "invoice",
    title: "Facture envoyée par email",
    adminTitle: `${actorName} a envoyé la facture ${invoice.reference} par email`,
    actorId: admin.id,
    description: `Facture ${invoice.reference} → ${client.email}`,
  });

  revalidateClient(invoice.client_id);
}

export async function downloadInvoicePdf(formData: FormData) {
  await requireAdmin();

  const invoiceId = formData.get("invoice_id");
  if (typeof invoiceId !== "string" || !invoiceId) throw new Error("Facture invalide.");

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("pdf_storage_path")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice?.pdf_storage_path) throw new Error("Aucun PDF disponible pour cette facture.");

  const url = await createSignedDownloadUrl(invoice.pdf_storage_path);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}

export async function replyToRequestThread(threadId: string, formData: FormData) {
  const admin = await requireAdmin();

  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) throw new Error("Message vide.");

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("client_id, project_id, subject")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) throw new Error("Demande introuvable.");

  const { error } = await supabaseAdmin.from("request_messages").insert({
    thread_id: threadId,
    client_id: thread.client_id,
    body: body.trim(),
    created_by: "admin",
    author_admin_id: admin.id,
  });
  if (error) throw new Error("L'envoi a échoué.");

  await supabaseAdmin
    .from("request_threads")
    .update({ status: "answered", updated_at: new Date().toISOString() })
    .eq("id", threadId);

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId: thread.client_id,
    projectId: thread.project_id,
    type: "message",
    title: `Message de ${actorName}`,
    adminTitle: `${actorName} a répondu à la demande « ${thread.subject} »`,
    actorId: admin.id,
    description: body.trim().slice(0, 140),
  });
  await notifyClientOfAdminReply({ clientId: thread.client_id, subject: thread.subject });

  revalidateClient(thread.client_id);
}
