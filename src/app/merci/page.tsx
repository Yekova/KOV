import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Merci — KOV",
  description: "Message reçu — on revient vers vous rapidement.",
  // Nothing to find here: this page only makes sense to someone who has just
  // sent the form. Indexed, it competes with /contact for the same intent and
  // lands people on a confirmation of something they never did.
  robots: { index: false, follow: true },
};

export default function MerciPage() {
  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen flex items-center justify-center px-6">
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
        {/* flex-wrap: two buttons at px-6 side by side clear 320px only just.
            Wrapping is free insurance and changes nothing above that. */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
