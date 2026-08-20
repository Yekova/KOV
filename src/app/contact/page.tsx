import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { MouseFrameBackdrop } from "@/components/ui/MouseFrameBackdrop";

export const metadata: Metadata = {
  title: "Contact — KOV",
  description: "Un projet en tête ? On le construit.",
};

// Must match the number of frames actually extracted into public/kov/character/contact-frames/.
const CONTACT_FRAME_COUNT = 60;

export default function ContactPage() {
  return (
    <main className="min-h-screen relative" style={{ background: "var(--kov-black)" }}>
      <MouseFrameBackdrop
        basePath="/kov/character/contact-frames"
        frameCount={CONTACT_FRAME_COUNT}
        poster={`/kov/character/contact-frames/frame-${String(Math.floor(CONTACT_FRAME_COUNT / 2)).padStart(3, "0")}.jpg`}
      />

      <div className="relative min-h-screen max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16 px-6 md:px-16 py-32">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-6">Contact</p>
          <h1
            className="font-display text-kov-bone uppercase"
            style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Un projet en tête ?
            <br />
            <span className="text-kov-red">On le construit.</span>
          </h1>
        </div>

        <div className="w-full max-w-xl">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
