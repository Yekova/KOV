"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLiquidRect } from "@/lib/useLiquidRect";
import { LiquidBlob } from "@/components/ui/LiquidBlob";

type ContactMethod = "phone" | "video" | "in_person";
type Timeline = "today" | "week" | "month";

interface Answers {
  name: string;
  email: string;
  company: string;
  contact_method: ContactMethod | "";
  timeline: Timeline | "";
  project_type: string[];
  message: string;
}

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: "phone", label: "Appel téléphonique" },
  { value: "video", label: "Visioconférence" },
  { value: "in_person", label: "En personne" },
];

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "today", label: "Dès aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
];

// Real categories already published on /expertise ("Ce qu'on construit") —
// reused here rather than inventing a separate theme taxonomy.
const THEMES = [
  "Sites corporate",
  "Sites immersifs",
  "Applications web",
  "Dashboards",
  "Espaces clients",
  "Systèmes numériques",
];

type StepKind = "text" | "email" | "choice" | "multichoice" | "textarea";

interface Step {
  key: keyof Answers;
  kind: StepKind;
  label: string;
  placeholder?: string;
  required: boolean;
}

const STEPS: Step[] = [
  { key: "name", kind: "text", label: "Votre nom", placeholder: "Jeanne Dupont", required: true },
  { key: "email", kind: "email", label: "Votre email", placeholder: "jeanne@entreprise.fr", required: true },
  { key: "company", kind: "text", label: "Votre entreprise", placeholder: "Facultatif", required: false },
  { key: "contact_method", kind: "choice", label: "Comment souhaitez-vous être recontacté ?", required: true },
  { key: "timeline", kind: "choice", label: "Sous quel délai ?", required: true },
  { key: "project_type", kind: "multichoice", label: "Quels sont les grands thèmes de votre projet ?", required: true },
  { key: "message", kind: "textarea", label: "Un mot sur votre projet ?", placeholder: "Facultatif — dites-nous en plus.", required: false },
];

type Status = "idle" | "submitting" | "success" | "error";

const CHOICE_CLASS = "px-6 py-3 border text-sm uppercase tracking-widest transition-colors";

export function ContactWizard() {
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    name: "",
    email: "",
    company: "",
    contact_method: "",
    timeline: "",
    project_type: [],
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  // Lazy initializer runs once at mount — a legitimate one-time capture, not
  // an impure render (that rule is about Server Components re-executing per
  // request; this is a plain client-side useState).
  const [renderedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const { containerRef, itemRefs, rect } = useLiquidRect<HTMLButtonElement>(step);

  function canAdvance() {
    if (!current.required) return true;
    const value = answers[current.key];
    return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  }

  function goTo(index: number) {
    if (index <= maxVisited) setStep(index);
  }

  function advance() {
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function handleChoiceSelect(value: string) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
    setTimeout(advance, 250);
  }

  function toggleTheme(theme: string) {
    setAnswers((a) => ({
      ...a,
      project_type: a.project_type.includes(theme)
        ? a.project_type.filter((t) => t !== theme)
        : [...a.project_type, theme],
    }));
  }

  async function submitLead() {
    setStatus("submitting");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: answers.name,
        email: answers.email,
        company: answers.company,
        contact_method: answers.contact_method,
        timeline: answers.timeline,
        project_type: answers.project_type.join(", "),
        message: answers.message,
        website: honeypot,
        rendered_at: renderedAt,
      }),
    });
    if (!response.ok) {
      setStatus("error");
      return;
    }
    setStatus("success");
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canAdvance()) return;
    if (isLast) submitLead();
    else advance();
  }

  if (status === "success") {
    return (
      <GlassCard className="max-w-xl p-8 md:p-12">
        <p className="text-kov-bone text-lg">
          Message reçu<span className="text-kov-red">.</span> On revient vers vous rapidement.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-xl p-8 md:p-12">
      <div ref={containerRef} className="relative flex items-center gap-2 mb-10">
        <LiquidBlob rect={rect} height={28} />
        {STEPS.map((s, index) => (
          <button
            key={s.key}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            onClick={() => goTo(index)}
            disabled={index > maxVisited}
            className="relative z-10 w-7 h-7 flex items-center justify-center text-[10px] font-mono transition-colors disabled:cursor-default"
            style={{
              color: index === step ? "var(--kov-white)" : index <= maxVisited ? "var(--kov-steel)" : "var(--kov-muted)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <form key={step} onSubmit={handleFormSubmit} style={{ animation: "fadeInUp 0.3s ease-out" }}>
        {/* Honeypot: invisible to real users (off-screen, unreachable by tab,
            hidden from screen readers), but a bot that indiscriminately
            fills every input on the page will populate it — caught server-side. */}
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

        <label className="block text-kov-steel text-xs uppercase tracking-widest mb-4">{current.label}</label>

        {(current.kind === "text" || current.kind === "email") && (
          <input
            autoFocus
            type={current.kind}
            value={answers[current.key] as string}
            onChange={(e) => setAnswers((a) => ({ ...a, [current.key]: e.target.value }))}
            placeholder={current.placeholder}
            className="w-full bg-transparent border-b-2 py-4 text-2xl md:text-3xl font-display text-kov-bone placeholder:text-kov-steel/50 focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)" }}
          />
        )}

        {current.kind === "textarea" && (
          <textarea
            autoFocus
            rows={4}
            value={answers.message}
            onChange={(e) => setAnswers((a) => ({ ...a, message: e.target.value }))}
            placeholder={current.placeholder}
            className="w-full bg-transparent border-b-2 py-4 text-lg text-kov-bone placeholder:text-kov-steel/50 focus:outline-none focus:border-kov-red transition-colors resize-none"
            style={{ borderColor: "var(--kov-border)" }}
          />
        )}

        {current.kind === "choice" && (
          <div className="flex flex-wrap gap-3">
            {(current.key === "contact_method" ? CONTACT_METHODS : TIMELINES).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChoiceSelect(opt.value)}
                className={CHOICE_CLASS}
                style={{
                  borderRadius: "var(--radius-pill)",
                  borderColor: answers[current.key] === opt.value ? "var(--kov-red)" : "var(--kov-border)",
                  color: answers[current.key] === opt.value ? "var(--kov-red)" : "var(--kov-bone)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {current.kind === "multichoice" && (
          <div className="flex flex-wrap gap-3">
            {THEMES.map((theme) => {
              const selected = answers.project_type.includes(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className={CHOICE_CLASS}
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

        {status === "error" && <p className="text-kov-red text-sm mt-4">Une erreur est survenue. Réessayez dans un instant.</p>}

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={back}
            className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
          >
            ← Précédent
          </button>

          {current.kind !== "choice" && (
            <Button type="submit" variant="primary" disabled={!canAdvance() || status === "submitting"}>
              {isLast ? (status === "submitting" ? "Envoi…" : "Envoyer →") : "Suivant →"}
            </Button>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
