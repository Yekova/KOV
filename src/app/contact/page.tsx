import type { Metadata } from "next";
import { ContactWizard } from "@/components/contact/ContactWizard";
import LiquidEther from "@/components/contact/LiquidEtherLazy";

export const metadata: Metadata = {
  title: "Contact — démarrer un projet web à Bordeaux | KOV",
  description:
    "Parlez-nous de votre projet de site internet, de refonte ou d'expérience immersive. On revient avec une lecture du problème avant de parler design.",
  alternates: { canonical: "https://kov-agency.site/contact" },
};

// The number, in the form wa.me wants it: country code, no plus, no
// leading zero. Written out from the national form once, here, rather
// than transformed at render — a phone number is not the place for
// clever string handling.
//
// It lives in the href and nowhere else. Nothing on the page prints it,
// which keeps it off the page for an address harvester reading text —
// though the link itself still carries it, so this is discretion rather
// than protection.
const WHATSAPP_NUMBER = "33614533556";

// WhatsApp's own mark, drawn rather than fetched: the CSP allows no
// external images, and an icon font for one glyph is absurd. In KOV red
// rather than WhatsApp green — it is a route to us, not an endorsement
// badge, and the page has exactly one accent.
function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen relative">
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
            style={{ fontSize: "clamp(32px, 4.5vw, 72px)", lineHeight: "var(--line-height-display)" }}
          >
            Un projet en tête ?
            <br />
            <span className="text-kov-red">On le construit.</span>
          </h1>

          {/* The fast lane. The form below is the considered route — this
              is for someone who wants an answer today, and saying so under
              the headline is the only place it helps. */}
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="text-xs uppercase tracking-widest text-kov-steel">Vous êtes pressé ?</p>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              // The destination is another origin; noopener keeps it from
              // reaching back through window.opener.
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-kov-red/45 px-4 py-2.5 text-kov-red transition-colors duration-300 hover:border-kov-red hover:bg-kov-red/10"
            >
              <WhatsAppMark />
              {/* The mark alone would be an unlabelled link. The word is
                  what names the destination, to a screen reader and to
                  everyone else. */}
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-kov-bone">WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="w-full max-w-xl">
          <ContactWizard />
        </div>
      </div>
    </main>
  );
}
