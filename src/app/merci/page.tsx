import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Merci — KOV",
  description: "Message reçu — on revient vers vous rapidement.",
};

export default function MerciPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-6">Message envoyé</p>
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Message reçu<span className="text-kov-red">.</span>
        </h1>
        <p className="mt-6 text-kov-concrete text-sm leading-relaxed">
          On revient vers vous rapidement. En attendant, vous pouvez continuer à explorer ce qu&apos;on construit.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button href="/" variant="primary">
            Retour à l&apos;accueil
          </Button>
          <Button href="/journal" variant="secondary">
            Voir le journal
          </Button>
        </div>
      </div>
    </main>
  );
}
