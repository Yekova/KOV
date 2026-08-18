import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — KOV",
  description: "Got a project? Tell us what you're building.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Contact</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-3xl mb-16"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Tell us what
        <br />
        you&apos;re building<span className="text-kov-red">.</span>
      </h1>

      <ContactForm />
    </main>
  );
}
