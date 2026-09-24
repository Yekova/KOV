import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PromptForm } from "../PromptForm";

export const metadata: Metadata = { title: "Modifier un prompt — Admin KOV" };

export default async function EditPromptPage(props: PageProps<"/admin/prompts/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Modifier</h1>
        <Link
          href={`/admin/prompts?use=${id}`}
          className="text-kov-steel hover:text-kov-red text-sm transition-colors"
        >
          Utiliser ce prompt →
        </Link>
      </div>
      <PromptForm promptId={id} />
    </main>
  );
}
