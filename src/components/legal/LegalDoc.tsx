import type { ReactNode } from "react";

interface LegalDocProps {
  title: string;
  updated: string;
  children: ReactNode;
}

// Shared layout for legal pages — plain, legible register, not the brand's
// display-heavy marketing voice. Prose styling is deliberately simple.
export function LegalDoc({ title, updated, children }: LegalDocProps) {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-3xl mx-auto">
      <h1 className="font-display text-kov-bone text-3xl md:text-4xl mb-2">{title}</h1>
      <p className="text-kov-steel text-xs uppercase tracking-widest mb-16">Dernière mise à jour : {updated}</p>
      <div className="space-y-10 text-kov-concrete text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-kov-bone [&_h2]:text-xl [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
