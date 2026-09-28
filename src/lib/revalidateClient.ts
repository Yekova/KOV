import { revalidatePath } from "next/cache";

// Shared by every server action that touches a client's projects, documents,
// invoices, quotes, or requests — both the admin and client portal views of
// that data need to reflect the change. Not itself a server action (no "use
// server"), just a plain helper called from within one, since a "use server"
// file may only export async functions.
export function revalidateClient(clientId: string) {
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/quotes");
  revalidatePath("/client");
  revalidatePath("/client/projects");
  revalidatePath("/client/documents");
  revalidatePath("/client/invoices");
  // Les deux : /client/quotes existe encore et redirige, mais c'est
  // /client/invoices qui affiche désormais les devis.
  revalidatePath("/client/quotes");
  revalidatePath("/client/invoices");
  revalidatePath("/client/requests");
}
