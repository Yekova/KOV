import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getEmailTemplatesAdmin } from "./actions";
import { EmailTemplatesManager } from "./EmailTemplatesManager";

export const metadata: Metadata = { title: "Modèles d'emails — Admin KOV" };

export default async function EmailTemplatesPage() {
  await requireAdmin();
  const templates = await getEmailTemplatesAdmin();

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <Link href="/admin/settings" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Paramètres
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Modèles d&apos;emails</h1>
        <p className="text-kov-steel text-sm mt-1">
          La bibliothèque utilisée par le composer depuis chaque fiche lead.
        </p>
      </div>

      <EmailTemplatesManager templates={templates} />
    </main>
  );
}
