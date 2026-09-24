import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PromptForm } from "../PromptForm";

export const metadata: Metadata = { title: "Nouveau prompt — Admin KOV" };

export default async function NewPromptPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Nouveau prompt</h1>
      <PromptForm />
    </main>
  );
}
