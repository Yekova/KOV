import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { Todo } from "@/components/legal/Todo";

export const metadata: Metadata = {
  title: "Legal Notice — KOV",
  description: "Legal notice for the KOV website.",
};

export default function LegalNoticePage() {
  return (
    <LegalDoc title="Legal Notice" updated="August 2026">
      <section>
        <h2>Site publisher</h2>
        <p>
          This website (kov-agency.site) is published by KOV, <Todo>legal form — e.g. auto-entrepreneur, SASU, EI</Todo>,
          registered under SIRET <Todo>SIRET number</Todo>, with its registered office at{" "}
          <Todo>registered address</Todo>, Bordeaux, France.
        </p>
        <p>
          Publication director: <Todo>full name of the person legally responsible for the site</Todo>.
        </p>
        <p>Contact: via the form at kov-agency.site/contact.</p>
      </section>

      <section>
        <h2>Hosting</h2>
        <p>This site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The KOV name, logo, and all content on this site (text, visuals, code) are the property of KOV unless
          otherwise stated. Reproduction without prior written consent is prohibited.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          KOV makes every effort to ensure the accuracy of the information published on this site but cannot
          guarantee it is complete or up to date at all times.
        </p>
      </section>
    </LegalDoc>
  );
}
