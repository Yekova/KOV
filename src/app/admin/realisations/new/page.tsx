import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ShowcaseForm } from "../ShowcaseForm";

export const metadata: Metadata = { title: "Nouvelle réalisation — Admin KOV" };

export default async function NewRealisationPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Nouvelle réalisation</h1>
      <ShowcaseForm />
    </main>
  );
}
