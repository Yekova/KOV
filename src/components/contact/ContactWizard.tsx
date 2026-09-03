"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { REVEAL_EASE } from "@/lib/motion";

type ContactMethod = "phone" | "video" | "in_person";
type Timeline = "today" | "week" | "month";

interface Answers {
  focus: string;
  contact_method: ContactMethod | "";
  timeline: Timeline | "";
  name: string;
  email: string;
  company: string;
  phone: string;
  extraThemes: string[];
  message: string;
}

// Real categories already published on /expertise ("Ce qu'on construit") —
// reused here rather than inventing a separate taxonomy. Step 1 picks one as
// the primary focus; step 5 offers the rest as optional additional tags, so
// the two steps ask genuinely different questions instead of repeating one.
const THEMES = [
  "Sites corporate",
  "Sites immersifs",
  "Applications web",
  "Dashboards",
  "Espaces clients",
  "Systèmes numériques",
];

const CONTACT_METHODS: { value: ContactMethod; label: string; icon: ReactNode }[] = [
  {
    value: "phone",
    label: "Appel téléphonique",
    icon: (
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1H7.2c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.2 2.3z" />
    ),
  },
  {
    value: "video",
    label: "Visioconférence",
    icon: (
      <>
        <rect x="2.5" y="6" width="13" height="12" rx="2" />
        <path d="M15.5 10.5l6-3.5v10l-6-3.5z" />
      </>
    ),
  },
  {
    value: "in_person",
    label: "En personne",
    icon: (
      <>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </>
    ),
  },
];

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "today", label: "Dès aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
];

const ADVANCE_DELAY_MS = 140;
const LEAVE_DURATION_MS = 180;
const ENTER_DURATION_MS = 280;

const FIELD_CLASS =
  "w-full bg-transparent border-b-2 py-3 text-lg font-display text-kov-bone placeholder:text-kov-steel/50 focus:outline-none focus:border-kov-red transition-colors";

function StepHeader({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <span
        className="shrink-0 w-6 h-6 flex items-center justify-center text-[10px] font-mono text-kov-red border"
        style={{ borderColor: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
      >
        {number}
      </span>
      <label className="text-kov-steel text-xs uppercase tracking-widest pt-1">{children}</label>
    </div>
  );
}

function StepDone({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full flex items-center justify-between gap-4 px-4 py-2.5 border text-left transition-colors hover:border-kov-red group"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <span className="min-w-0">
        <span className="block text-kov-steel text-[10px] uppercase tracking-widest">{label}</span>
        <span className="block text-kov-bone text-sm truncate">{value}</span>
      </span>
      <span className="shrink-0 text-kov-steel text-xs uppercase tracking-widest group-hover:text-kov-red transition-colors">
        Modifier
      </span>
    </button>
  );
}

const CHOICE_CARD_CLASS =
  "relative flex flex-col items-start gap-2 p-4 border text-left transition-colors";

export function ContactWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("entering");
  const [answers, setAnswers] = useState<Answers>({
    focus: "",
    contact_method: "",
    timeline: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    extraThemes: [],
    message: "",
  });
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle");
  // Lazy initializer, not a render-time Date.now() call — see components/ui/Reveal.tsx.
  const [renderedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");

  // Same hand-rolled "leave then enter" sequence used for the enter-only
  // case in components/ui/Reveal.tsx — here both directions matter, since
  // this stands in for AnimatePresence mode="wait" without adding the
  // dependency. setPhase("idle") lives in a rAF callback (an external-system
  // callback, same exception as a setTimeout callback), not synchronously in
  // the effect body, so it isn't flagged by the same rule fixed in Reveal.tsx.
  useEffect(() => {
    if (phase !== "entering") return;
    const raf = requestAnimationFrame(() => setPhase("idle"));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function goToStep(next: number) {
    if (next === step) return;
    setPhase("leaving");
    setTimeout(() => {
      setStep(next);
      setPhase("entering");
    }, LEAVE_DURATION_MS);
  }

  function selectAndAdvance<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(() => goToStep(step + 1), ADVANCE_DELAY_MS);
  }

  function toggleExtraTheme(theme: string) {
    setAnswers((a) => ({
      ...a,
      extraThemes: a.extraThemes.includes(theme) ? a.extraThemes.filter((t) => t !== theme) : [...a.extraThemes, theme],
    }));
  }

  async function handleDetailsContinue() {
    setDetailsError(null);
    const name = answers.name.trim();
    const email = answers.email.trim();
    const phone = answers.phone.trim();

    if (!name) {
      setDetailsError("Votre nom est requis.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDetailsError("Cette adresse email n'est pas valide.");
      return;
    }
    if (phone && !/^(\+33|0)\s*[1-9](\s*\d{2}){4}$/.test(phone)) {
      setDetailsError("Ce numéro de téléphone n'est pas valide.");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/verify-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!result.valid) {
        setDetailsError("Cette adresse email semble introuvable — vérifiez qu'il n'y a pas de faute de frappe.");
        setVerifying(false);
        return;
      }
    } catch {
      // Network failure on the verification call itself — fail open rather
      // than blocking a real submission over our own connectivity issue.
    }
    setVerifying(false);
    goToStep(step + 1);
  }

  async function handleSubmit() {
    setSubmitStatus("submitting");
    const projectType = [answers.focus, ...answers.extraThemes].filter(Boolean).join(", ");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: answers.name,
          email: answers.email,
          company: answers.company,
          phone: answers.phone,
          contact_method: answers.contact_method,
          timeline: answers.timeline,
          project_type: projectType,
          message: answers.message,
          website: honeypot,
          rendered_at: renderedAt,
        }),
      });
      if (!response.ok) throw new Error("submit failed");
      router.push("/merci");
    } catch {
      setSubmitStatus("error");
    }
  }

  const contactMethodLabel = CONTACT_METHODS.find((m) => m.value === answers.contact_method)?.label ?? "";
  const timelineLabel = TIMELINES.find((t) => t.value === answers.timeline)?.label ?? "";
  const coordinatesSummary = [answers.name, answers.company].filter(Boolean).join(" — ");
  const remainingThemes = THEMES.filter((t) => t !== answers.focus);

  const transitionStyle = {
    opacity: phase === "leaving" ? 0 : phase === "idle" ? 1 : 0,
    transform: phase === "leaving" ? "translateY(-8px)" : phase === "idle" ? "translateY(0)" : "translateY(14px)",
    transition:
      phase === "leaving"
        ? `opacity ${LEAVE_DURATION_MS}ms ${REVEAL_EASE}, transform ${LEAVE_DURATION_MS}ms ${REVEAL_EASE}`
        : `opacity ${ENTER_DURATION_MS}ms ${REVEAL_EASE}, transform ${ENTER_DURATION_MS}ms ${REVEAL_EASE}`,
  };

  return (
    // width/height "auto" — GlassSurface wraps its real content (the inner
    // w-full div below) and sizes to fit it, rather than being a
    // position:absolute overlay stretched via a percentage inside an
    // auto-sized parent — that combination broke Nav's pill once already
    // (see GlassSurface.tsx's own note). The inner div also exists so
    // GlassSurface's own content wrapper (display:flex, centered by
    // default — fine for a single-line pill, wrong for a stacked form)
    // doesn't fight this multi-step form's vertical layout.
    <GlassSurface width="auto" height="auto" borderRadius={8} className="max-w-xl">
      <div className="w-full p-8 md:p-12">
      {/* Honeypot — invisible to real users, catches bots that fill every field. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <div className="space-y-2 mb-6">
        {step > 0 && (
          <StepDone label="Besoin principal" value={answers.focus} onEdit={() => goToStep(0)} />
        )}
        {step > 1 && (
          <StepDone label="Contact souhaité" value={contactMethodLabel} onEdit={() => goToStep(1)} />
        )}
        {step > 2 && <StepDone label="Délai" value={timelineLabel} onEdit={() => goToStep(2)} />}
        {step > 3 && (
          <StepDone label="Coordonnées" value={coordinatesSummary || answers.email} onEdit={() => goToStep(3)} />
        )}
      </div>

      <div style={transitionStyle}>
        {step === 0 && (
          <div>
            <StepHeader number={1}>Quel est votre besoin principal ?</StepHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => selectAndAdvance("focus", theme)}
                  aria-pressed={answers.focus === theme}
                  className={CHOICE_CARD_CLASS}
                  style={{
                    borderColor: answers.focus === theme ? "var(--kov-red)" : "var(--kov-border)",
                    borderRadius: "var(--radius-md)",
                    color: answers.focus === theme ? "var(--kov-red)" : "var(--kov-bone)",
                  }}
                >
                  <span className="text-sm">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <StepHeader number={2}>Comment souhaitez-vous être recontacté ?</StepHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTACT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => selectAndAdvance("contact_method", method.value)}
                  aria-pressed={answers.contact_method === method.value}
                  className={CHOICE_CARD_CLASS}
                  style={{
                    borderColor: answers.contact_method === method.value ? "var(--kov-red)" : "var(--kov-border)",
                    borderRadius: "var(--radius-md)",
                    color: answers.contact_method === method.value ? "var(--kov-red)" : "var(--kov-bone)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {method.icon}
                  </svg>
                  <span className="text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <StepHeader number={3}>Sous quel délai ?</StepHeader>
            <div className="grid grid-cols-2 gap-3">
              {TIMELINES.map((timeline) => (
                <button
                  key={timeline.value}
                  type="button"
                  onClick={() => selectAndAdvance("timeline", timeline.value)}
                  aria-pressed={answers.timeline === timeline.value}
                  className={CHOICE_CARD_CLASS}
                  style={{
                    borderColor: answers.timeline === timeline.value ? "var(--kov-red)" : "var(--kov-border)",
                    borderRadius: "var(--radius-md)",
                    color: answers.timeline === timeline.value ? "var(--kov-red)" : "var(--kov-bone)",
                  }}
                >
                  <span className="text-sm">{timeline.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <StepHeader number={4}>Vos coordonnées</StepHeader>
            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Votre nom"
                value={answers.name}
                onChange={(e) => setAnswers((a) => ({ ...a, name: e.target.value }))}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
              <input
                type="email"
                placeholder="Votre email"
                value={answers.email}
                onChange={(e) => setAnswers((a) => ({ ...a, email: e.target.value }))}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
              <input
                type="text"
                placeholder="Votre entreprise (facultatif)"
                value={answers.company}
                onChange={(e) => setAnswers((a) => ({ ...a, company: e.target.value }))}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
              <input
                type="tel"
                placeholder="Votre téléphone (facultatif)"
                value={answers.phone}
                onChange={(e) => setAnswers((a) => ({ ...a, phone: e.target.value }))}
                className={FIELD_CLASS}
                style={{ borderColor: "var(--kov-border)" }}
              />
            </div>
            {detailsError && <p className="text-kov-red text-sm mt-4">{detailsError}</p>}
            <div className="flex justify-end mt-8">
              <Button type="button" variant="primary" onClick={handleDetailsContinue} disabled={verifying}>
                {verifying ? "Vérification…" : "Continuer →"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <StepHeader number={5}>Autre chose à ajouter ?</StepHeader>
            {remainingThemes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {remainingThemes.map((theme) => {
                  const selected = answers.extraThemes.includes(theme);
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => toggleExtraTheme(theme)}
                      aria-pressed={selected}
                      className="px-4 py-2 border text-xs uppercase tracking-widest transition-colors"
                      style={{
                        borderRadius: "var(--radius-pill)",
                        borderColor: selected ? "var(--kov-red)" : "var(--kov-border)",
                        background: selected ? "var(--kov-red)" : "transparent",
                        color: selected ? "var(--kov-white)" : "var(--kov-bone)",
                      }}
                    >
                      {theme}
                    </button>
                  );
                })}
              </div>
            )}
            <textarea
              rows={3}
              placeholder="Un mot sur votre projet… (facultatif)"
              value={answers.message}
              onChange={(e) => setAnswers((a) => ({ ...a, message: e.target.value }))}
              className={`${FIELD_CLASS} resize-none`}
              style={{ borderColor: "var(--kov-border)" }}
            />
            {submitStatus === "error" && (
              <p className="text-kov-red text-sm mt-4">Une erreur est survenue. Réessayez dans un instant.</p>
            )}
            <div className="flex justify-end mt-8">
              <Button type="button" variant="primary" onClick={handleSubmit} disabled={submitStatus === "submitting"}>
                {submitStatus === "submitting" ? "Envoi…" : "Envoyer →"}
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </GlassSurface>
  );
}
