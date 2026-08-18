import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { GlassSphere } from "@/components/ui/GlassSphere";

export const metadata: Metadata = {
  title: "Contact — KOV",
  description: "Have a project? Let's build it.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto relative overflow-hidden">
      <GlassSphere size={200} className="absolute top-24 right-10 hidden md:block" />
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Contact</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-3xl mb-16"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Have a project?
        <br />
        <span className="text-kov-red">Let&apos;s build it.</span>
      </h1>

      <ContactForm />
    </main>
  );
}
