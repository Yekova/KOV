import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Use — KOV",
  description: "Terms of use for the KOV website.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Use" updated="August 2026">
      <section>
        <h2>Scope</h2>
        <p>
          These terms govern use of the kov-agency.site website only. They do not constitute a service contract —
          project engagements with KOV are governed by a separate written agreement.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          You agree not to use this site in a way that damages, disables, or impairs it, or interferes with
          another party&apos;s use of it.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>Content on this site is protected by copyright. See the Legal Notice for details.</p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by French law. Disputes fall under the jurisdiction of the courts of Bordeaux, France.</p>
      </section>
    </LegalDoc>
  );
}
