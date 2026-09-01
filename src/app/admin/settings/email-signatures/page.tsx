import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getMySignatures } from "./actions";
import { SignaturesManager } from "./SignaturesManager";

export const metadata: Metadata = { title: "Signatures — Admin KOV" };

export default async function EmailSignaturesPage() {
  await requireAdmin();
  const signatures = await getMySignatures();

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <Link href="/admin/settings" className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors">
          ← Paramètres
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Signatures</h1>
        <p className="text-kov-steel text-sm mt-1">
          Vos signatures personnelles — la signature par défaut est proposée automatiquement dans le composer.
        </p>
      </div>

      <SignaturesManager signatures={signatures} />
    </main>
  );
}
