"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Database,
  File,
  Globe,
  Layers,
  Orbit,
  Palette,
  Settings,
  Smartphone,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { gsap, initGsap, motion, stagger, GSAP_REVEAL_EASE } from "@/lib/motion";
import { ScrollFloat } from "@/components/ui/ScrollFloat";
import "./ScreenShowcase.css";

// The two lists are index-matched on purpose: row i on the left is the same
// concern as row i on the right, which is what makes the cross-hover a real
// relationship rather than a decorative highlight. Reordering one without the
// other breaks that silently, so they sit side by side here.
const STANDARD: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: File, title: "Template", body: "Un design générique, sans identité forte." },
  { Icon: Layers, title: "Pages isolées", body: "Un contenu sans logique globale." },
  { Icon: Sparkles, title: "Animations décoratives", body: "Des effets sans réel impact." },
  { Icon: Smartphone, title: "Responsive adapté", body: "Une adaptation minimale." },
  { Icon: Settings, title: "CMS basique", body: "Une gestion limitée et contraignante." },
  { Icon: Globe, title: "Site web", body: "Une simple vitrine en ligne." },
];

const KOV: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Palette, title: "Direction artistique", body: "Une identité sur mesure, pensée pour marquer." },
  { Icon: Target, title: "Parcours cohérent", body: "Une expérience fluide, de la découverte à l'action." },
  { Icon: Zap, title: "Motion utile", body: "Des animations au service du sens et de la conversion." },
  { Icon: Smartphone, title: "Responsive pensé dès le départ", body: "Une expérience optimale sur tous les écrans." },
  { Icon: Database, title: "Système évolutif", body: "Un CMS puissant, flexible et intuitif." },
  { Icon: Orbit, title: "Univers digital", body: "Un écosystème complet au service de vos objectifs." },
];

// The "why KOV" moment: the same six concerns twice, one treated as a
// presence and one as a system, so the difference registers before a word of
// it is read.
//
// The form carries the argument, which is why this is not a table. The left
// column is deliberately flat — one surface, one weight, no accent, no
// depth, no affordance. The right one has a lit rim, a red index, a chevron
// and a floor gradient. Neither side has to claim to be better; the pixels
// already said it.
export function ScreenShowcase() {
  const cardRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // One index for both columns: hovering either side lights the pair.
  const [active, setActive] = useState<number | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const card = cardRef.current;
    if (!card) return;
    initGsap();

    const ctx = gsap.context(() => {
      // Container, left, divider, right, rows — the order the argument is
      // made in. One timeline and one ScrollTrigger: five separate triggers
      // would desync the moment anyone scrolled back up through it.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: card, start: "top bottom", toggleActions: "play none none reverse" },
      });

      tl.fromTo(
        card,
        { opacity: 0, y: 90, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: motion.slow, ease: GSAP_REVEAL_EASE }
      )
        .fromTo(leftRef.current, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: motion.normal, ease: GSAP_REVEAL_EASE }, "-=0.45")
        .fromTo(dividerRef.current, { opacity: 0, scaleY: 0.5 }, { opacity: 1, scaleY: 1, duration: motion.fast, ease: GSAP_REVEAL_EASE }, "-=0.3")
        .fromTo(rightRef.current, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: motion.normal, ease: GSAP_REVEAL_EASE }, "-=0.25")
        .fromTo(
          bodyRef.current?.querySelectorAll(".kov-cmp-row") ?? [],
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: motion.fast, ease: GSAP_REVEAL_EASE, stagger: stagger.tight },
          "-=0.3"
        );
    }, card);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="showcase" className="px-6 py-20 md:py-32 max-w-[1600px] mx-auto">
      <ScrollFloat
        containerClassName="text-center mb-24 md:mb-36"
        textClassName="font-display text-kov-bone uppercase text-[clamp(26px,3.4vw,54px)] leading-[0.95]"
        stagger={0.02}
      >
        {"Un site n'est pas une page.\nC'est un système."}
      </ScrollFloat>

      <div className="relative max-w-[1360px] mx-auto">
        {/* Tilted asides. Decoration — they restate what the columns already
            say — so aria-hidden, and only from xl up, where there is room
            beside the window rather than on top of it. */}
        <div aria-hidden="true" className="kov-cmp-aside kov-cmp-aside--left">
          <TrendingDown size={15} strokeWidth={1.6} />
          <span>
            <span className="kov-cmp-aside__title">Un site qui stagne</span>
            <span className="kov-cmp-aside__body">Peu de résultats.</span>
          </span>
        </div>
        <div aria-hidden="true" className="kov-cmp-aside kov-cmp-aside--right">
          <TrendingUp size={15} strokeWidth={1.6} className="text-kov-red" />
          <span>
            <span className="kov-cmp-aside__title">Un système qui propulse</span>
            <span className="kov-cmp-aside__body">Des résultats concrets.</span>
          </span>
        </div>

        <div ref={cardRef} className="kov-cmp-window">
          {/* Window chrome, kept to three marks: dots, a handle, a line of
              text. Enough to read as an interface, short of pretending to be
              a browser. */}
          <div className="kov-cmp-chrome" aria-hidden="true">
            <span className="kov-cmp-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="kov-cmp-handle" />
            <span className="kov-cmp-chrome__label">
              De l&apos;existence à l&apos;impact
              <span className="kov-cmp-rule" />
            </span>
          </div>

          <div ref={bodyRef} className="kov-cmp-body">
            {/* ── Left: a presence ─────────────────────────────────────── */}
            <div ref={leftRef} className="kov-cmp-col kov-cmp-col--flat">
              <div className="kov-cmp-head">
                <p className="kov-cmp-eyebrow">
                  <span aria-hidden="true" className="kov-cmp-dot" />
                  Site standard
                </p>
                <span className="kov-cmp-badge">Limité</span>
              </div>
              <h3 className="kov-cmp-title">Un site classique</h3>
              <p className="kov-cmp-sub">Une présence en ligne, rien de plus.</p>

              <ul className="kov-cmp-list">
                {STANDARD.map((item, i) => (
                  <li key={item.title}>
                    <div
                      className={`kov-cmp-row kov-cmp-row--flat${active === i ? " is-linked" : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                    >
                      <span aria-hidden="true" className="kov-cmp-ico">
                        <item.Icon size={17} strokeWidth={1.6} />
                      </span>
                      <span className="kov-cmp-row__text">
                        <span className="kov-cmp-row__title">{item.title}</span>
                        <span className="kov-cmp-row__body">{item.body}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── The divider ──────────────────────────────────────────── */}
            <div ref={dividerRef} className="kov-cmp-divider" aria-hidden="true">
              <span className="kov-cmp-divider__line kov-cmp-divider__line--pale" />
              <span className="kov-cmp-divider__vs">VS</span>
              <span className="kov-cmp-divider__line kov-cmp-divider__line--red" />
            </div>

            {/* ── Right: a system ──────────────────────────────────────── */}
            <div ref={rightRef} className="kov-cmp-col kov-cmp-col--lit">
              <div className="kov-cmp-head">
                <p className="kov-cmp-eyebrow kov-cmp-eyebrow--red">
                  <span aria-hidden="true" className="kov-cmp-dot kov-cmp-dot--red" />
                  Expérience KOV
                </p>
                <span className="kov-cmp-badge kov-cmp-badge--red">Supérieur</span>
              </div>
              <h3 className="kov-cmp-title kov-cmp-title--lit">Un système pensé pour l&apos;impact</h3>
              <p className="kov-cmp-sub">Stratégie. Design. Technologie. Résultats.</p>

              <ul className="kov-cmp-list">
                {KOV.map((item, i) => (
                  <li key={item.title}>
                    <div
                      className={`kov-cmp-row kov-cmp-row--lit${active === i ? " is-linked" : ""}`}
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                    >
                      <span aria-hidden="true" className="kov-cmp-ico kov-cmp-ico--red">
                        <item.Icon size={17} strokeWidth={1.7} />
                      </span>
                      <span className="kov-cmp-row__text">
                        <span className="kov-cmp-row__title kov-cmp-row__title--lit">
                          <span aria-hidden="true" className="kov-cmp-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {item.title}
                        </span>
                        <span className="kov-cmp-row__body">{item.body}</span>
                      </span>
                      <ChevronRight aria-hidden="true" size={15} strokeWidth={2} className="kov-cmp-chev" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="kov-cmp-foot" aria-hidden="true">
            <span className="font-display text-kov-bone text-[11px] tracking-[0.3em]">KOV</span>
            <span className="kov-cmp-foot__label">
              Plus qu&apos;un site. Un avantage.
              <span className="kov-cmp-rule" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
