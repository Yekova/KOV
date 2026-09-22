import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ShowcaseForm } from "../ShowcaseForm";

export const metadata: Metadata = { title: "Modifier une réalisation — Admin KOV" };

export default async function EditRealisationPage(props: PageProps<"/admin/realisations/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Modifier</h1>
        {/* Opens the real public page rather than an admin-shaped rendering
            of it — see the preview route on why it lives outside /admin. */}
        <Link
          href={`/projets/preview/${id}`}
          target="_blank"
          className="text-kov-steel hover:text-kov-red text-sm transition-colors"
        >
          Aperçu →
        </Link>
      </div>
      <ShowcaseForm projectId={id} />
    </main>
  );
}
