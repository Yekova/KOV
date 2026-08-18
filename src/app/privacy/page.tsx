import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { Todo } from "@/components/legal/Todo";

export const metadata: Metadata = {
  title: "Privacy Policy — KOV",
  description: "How KOV collects and processes personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="August 2026">
      <section>
        <h2>What we collect</h2>
        <p>
          The only personal data KOV collects is what you submit through the contact form: name, email address,
          phone number (optional), and your message. We do not use cookies or analytics tracking on this site
          beyond what is strictly necessary for it to function.
        </p>
      </section>

      <section>
        <h2>Why we collect it</h2>
        <p>Solely to respond to the project inquiry you initiated. We do not sell or share this data with third parties for marketing purposes.</p>
      </section>

      <section>
        <h2>Legal basis</h2>
        <p>Processing is based on your consent, given by voluntarily submitting the form.</p>
      </section>

      <section>
        <h2>Where it&apos;s stored</h2>
        <p>
          Submissions are stored in a Supabase database hosted in the EU (Ireland). The site itself is hosted by
          Vercel Inc. (USA). No data is used to train any AI model.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          We keep contact form submissions for <Todo>retention period — e.g. 3 years from last contact</Todo>, after
          which they are deleted.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under GDPR, you have the right to access, correct, delete, or export your data, and to withdraw consent
          at any time. To exercise these rights, contact us at <Todo>contact email address</Todo> or via the
          contact form.
        </p>
      </section>
    </LegalDoc>
  );
}
