import type { Metadata } from "next";
import { ContactWizard } from "@/components/contact/ContactWizard";
import LiquidEther from "@/components/contact/LiquidEtherLazy";

export const metadata: Metadata = {
  title: "Contact — KOV",
  description: "Un projet en tête ? On le construit.",
  alternates: { canonical: "https://kov-agency.site/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen relative" style={{ background: "var(--kov-black)" }}>
      <div className="fixed inset-0" style={{ zIndex: "var(--z-canvas)", pointerEvents: "none" }}>
        {/* colors: KOV bone → red → soft red-tint, in place of the demo's
            purple/pink defaults — closest on-brand read of the color0/1/2
            values given (those props don't exist on the real component; it
            only takes a single `colors` array). */}
        {/* iterationsPoisson: 20, not the default 32 — the pressure solve
            is 1 full-screen ping-pong pass per iteration, by far the
            biggest per-frame GPU cost in this sim. 20 is the pressure-
            iteration count real-time WebGL fluid demos converge on (e.g.
            Pavel Dobryakov's reference implementation defaults to 20), and
            cutting ~12 passes/frame is what was causing the reported
            latency/slow reaction — this sim's dt is fixed per rendered
            frame, not tied to real elapsed time, so a lower frame rate
            reads directly as the fluid lagging behind the cursor. */}
        <LiquidEther
          colors={["#f9f9f9", "#ff0000", "#fecccc"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={37}
          iterationsViscous={32}
          iterationsPoisson={20}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

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
          <ContactWizard />
        </div>
      </div>
    </main>
  );
}
