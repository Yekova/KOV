import { revalidatePath } from "next/cache";

// Everywhere a portfolio project is rendered.
//
// A plain helper rather than a Server Action — a "use server" file may only
// export async functions, so this is called from inside one, the same shape
// as revalidateClient.ts.
//
// The list is the whole point: a project appears on four surfaces, and
// three of them are easy to forget. /projets and the homepage grid are
// obvious; the homepage hero also renders the featured project in its
// spotlight widget, and the sitemap lists /projets. Missing one means an
// edit that is live in one place and stale in another, which is worse than
// an edit that has not landed at all.
export function revalidateShowcase() {
  revalidatePath("/admin/realisations");
  revalidatePath("/projets");
  // The hero's spotlight widget and the WorkGallery grid both live here.
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
