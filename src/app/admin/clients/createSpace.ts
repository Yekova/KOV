"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getActorDisplayName, logActivity } from "@/lib/activity";
import { provisionClient } from "@/lib/clients/provision";
import { createProjectRow } from "@/app/admin/clients/actions";
import { addDefaultPhases } from "@/app/admin/projects/[id]/actions";
import { KOV_PHASES } from "@/lib/process/phases";
import { createDesignPage } from "@/lib/design/mutations";

// Créer un espace client d'un seul geste : le compte, le projet, ses
// phases, sa page de validation, et l'invitation.
//
// ── CE QUE CETTE FONCTION N'EST PAS ──────────────────────────────────
//
// Ce n'est pas un nouveau chemin de création. Elle enchaîne ceux qui
// existent — provisionClient, createProjectRow, addDefaultPhases,
// createDesignPage — pour que l'assistant n'ait qu'un appel à faire. Si
// elle en recréait un seul à sa façon, la création directe et la
// conversion d'un lead finiraient par produire des clients différents.
//
// ── L'ÉCHEC PARTIEL NE S'ANNULE PAS ──────────────────────────────────
//
// L'invitation part par email dès que le compte existe. Un email ne se
// dé-envoie pas : annuler la création après coup laisserait le client
// avec un lien vers un compte supprimé, ce qui est pire que le problème.
//
// Donc quand le compte réussit et que le projet échoue, on renvoie le
// client créé ET l'erreur du projet. L'assistant le dit, et l'admin
// termine à la main. Rien n'est caché, rien n'est défait.

export interface CreateSpaceResult {
  error?: string;
  clientId?: string;
  projectId?: string;
  /** L'erreur du projet quand le CLIENT, lui, a bien été créé. */
  projectError?: string;
  /** Toujours renvoyé : c'est ce qui permet de transmettre l'accès à la
   *  main quand l'email n'arrive pas — un cas constaté sur ce projet. */
  actionLink?: string;
  emailSent?: boolean;
  emailError?: string | null;
}

export async function createClientSpace(input: {
  email: string;
  fullName: string;
  company?: string | null;
  phone?: string | null;
  accountManagerId?: string | null;
  project?: {
    name: string;
    category: string;
    projectManagerId?: string | null;
    withPhases: boolean;
    withValidation: boolean;
  } | null;
}): Promise<CreateSpaceResult> {
  const admin = await requireAdmin();

  if (!input.email.trim()) return { error: "Email requis." };
  if (!input.fullName.trim()) return { error: "Nom requis." };
  if (input.project && !input.project.name.trim()) return { error: "Nom du projet requis." };
  if (input.project && !input.project.category.trim()) return { error: "Catégorie du projet requise." };

  // ── 1. Le compte et l'invitation ───────────────────────────────────
  let provisioned;
  try {
    provisioned = await provisionClient({
      email: input.email,
      fullName: input.fullName,
      company: input.company ?? null,
      phone: input.phone ?? null,
      accountManagerId: input.accountManagerId ?? null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "La création du client a échoué." };
  }

  const clientId = provisioned.userId;
  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    type: "milestone",
    title: "Bienvenue chez KOV",
    adminTitle: `${actorName} a créé l'espace de ${input.fullName.trim()}`,
    actorId: admin.id,
  });

  const base: CreateSpaceResult = {
    clientId,
    actionLink: provisioned.actionLink,
    emailSent: provisioned.emailSent,
    emailError: provisioned.emailError,
  };

  if (!input.project) {
    revalidatePath("/admin/clients");
    return base;
  }

  // ── 2. Le projet, ses phases, sa page de validation ────────────────
  try {
    const form = new FormData();
    form.set("client_id", clientId);
    form.set("name", input.project.name);
    form.set("category", input.project.category);
    if (input.project.projectManagerId) form.set("project_manager_id", input.project.projectManagerId);
    const { projectId } = await createProjectRow(form);

    if (input.project.withPhases) {
      await addDefaultPhases(projectId, KOV_PHASES);
    }

    if (input.project.withValidation) {
      // Une page, MASQUÉE. L'espace de validation n'est pas un objet que
      // l'on crée : il existe dès qu'une page y est visible. On prépare
      // donc l'endroit où déposer la première maquette, sans l'ouvrir au
      // client avant qu'il y ait quelque chose à regarder.
      await createDesignPage(
        { kind: "admin", id: admin.id },
        { projectId, title: "Page d'accueil", visibleToClient: false }
      );
    }

    revalidatePath("/admin/clients");
    revalidatePath("/admin/projects");
    return { ...base, projectId };
  } catch (error) {
    // Le client existe et son invitation est partie : on le dit, on ne
    // l'efface pas.
    return {
      ...base,
      projectError: error instanceof Error ? error.message : "Le projet n'a pas pu être créé.",
    };
  }
}
