"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { pinAndTrack } from "@/lib/motion";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { ActivationCard } from "@/components/home/ActivationCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { APPROACH_CARDS, ARC_PEEK, ARC_STEP_DEG, WHEEL_RADIUS, WHEEL_STEP_DEG } from "@/data/approachCards";
import "@/components/home/heroCta.css";
import "./heroStage.css";

// Le premier écran et la roue : UNE scène, pas deux sections.
//
// ── POURQUOI CETTE FUSION ────────────────────────────────────────────
//
// Les cartes étaient rendues deux fois — trois dans un composant d'arc
// posé sous la hero, six dans une roue placée dans la section suivante.
// Quelle que soit leur géométrie, cela fait DEUX objets à l'écran, ce qui
// est exactement ce que le propriétaire ne voulait pas. Aucun réglage de
// rayon ou de pas ne corrige ça : il fallait supprimer le doublon.
//
// Il n'existe donc plus qu'un seul jeu de six cartes. Au repos, on n'en
// voit que le haut dépasser au bas du premier écran. En défilant, ces
// MÊMES cartes montent, l'éventail s'ouvre, la roue tourne, puis elle
// grossit et s'en va par le haut.
//
// La scène entière est l'élément épinglé : c'est la seule façon pour que
// la hero et la roue partagent les mêmes nœuds. La navigation n'en
// souffre pas — Nav en variante « contained » repasse en `fixed` dès le
// premier pixel de défilement, elle ne reste pas prisonnière du cadre.
//
// ── CE QUI EST ÉCRIT DANS LE DOM, ET CE QUI NE L'EST PAS ─────────────
//
// Toutes les transformations sont posées directement sur les nœuds à
// chaque image. Un état React par pixel de défilement rendrait six cartes
// et leurs graphiques soixante fois par seconde. Seul l'index actif passe
// par un état, et uniquement quand il change.

/** Les trois temps, en progression de défilement. */
const ENTER_UNTIL = 0.14;
const EXIT_FROM = 0.8;

/** Où se pose la carte du sommet une fois la roue en place, en hauteur
 *  d'écran. Sous le titre, qui occupe le haut. */
const WHEEL_TOP_VH = 30;

/** La sortie : elle grossit et monte. Points de départ, jamais vus à
 *  l'écran — aucun navigateur ne tourne sur ce projet. */
const EXIT_SCALE = 1.55;
const EXIT_RISE_VH = 42;

export function HeroStage() {
  const stageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const compact = useMediaQuery("(max-width: 767px)");
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const plain = compact || reducedMotion;

  useEffect(() => {
    const stage = stageRef.current;
    const hero = heroRef.current;
    const head = headRef.current;
    const wheel = wheelRef.current;
    if (plain || !stage || !hero || !head || !wheel) return;

    let lastIndex = -1;

    const trigger = pinAndTrack(
      stage,
      (progress) => {
        // ── 1. L'ARRIVÉE ────────────────────────────────────────────
        // Le texte de la hero s'efface, le titre de la roue le remplace,
        // et les cartes montent depuis le bas de l'écran.
        const entering = Math.min(1, progress / ENTER_UNTIL);

        hero.style.opacity = String(1 - entering);
        hero.style.transform = `translateY(${-entering * 8}vh)`;
        // Le h1 cesse de capter le pointeur une fois effacé, sinon ses
        // deux boutons resteraient cliquables sous la roue.
        hero.style.pointerEvents = entering > 0.6 ? "none" : "auto";

        head.style.opacity = String(entering);
        head.style.transform = `translateY(${(1 - entering) * 4}vh)`;

        // ── 2. LA ROTATION ──────────────────────────────────────────
        const turning = Math.min(1, Math.max(0, (progress - ENTER_UNTIL) / (EXIT_FROM - ENTER_UNTIL)));
        const turn = turning * (APPROACH_CARDS.length - 1) * WHEEL_STEP_DEG;

        // ── 3. LA SORTIE ────────────────────────────────────────────
        const leaving = Math.max(0, (progress - EXIT_FROM) / (1 - EXIT_FROM));
        const scale = 1 + leaving * (EXIT_SCALE - 1);

        // Au repos, la roue est descendue de façon à ne laisser dépasser
        // que ARC_PEEK pixels de carte au bas de l'écran. Le calcul est
        // fait ici et non en CSS parce qu'il mélange une hauteur d'écran
        // et des pixels, et qu'il doit suivre un redimensionnement.
        const restDrop = window.innerHeight * ((100 - WHEEL_TOP_VH) / 100) - ARC_PEEK;
        const drop = (1 - entering) * restDrop;
        const rise = (leaving * EXIT_RISE_VH * window.innerHeight) / 100;

        wheel.style.transform = `translate(-50%, ${drop - rise}px) scale(${scale})`;
        wheel.style.opacity = String(1 - leaving);
        head.style.opacity = String(entering * (1 - leaving));

        // ── L'ÉVENTAIL S'OUVRE ──────────────────────────────────────
        //
        // Le pas angulaire passe de celui de l'arc à celui de la roue
        // pendant l'arrivée : serré quand on ne fait que deviner les
        // cartes, écarté quand il faut les lire. C'est le même objet qui
        // se déplie, et c'est ce qui remplace l'ancien doublon.
        const step = ARC_STEP_DEG + entering * (WHEEL_STEP_DEG - ARC_STEP_DEG);

        for (let i = 0; i < slotRefs.current.length; i += 1) {
          const slot = slotRefs.current[i];
          if (!slot) continue;
          const angle = i * step - turn;
          slot.style.transform = `rotate(${angle}deg) translateY(${-WHEEL_RADIUS}px)`;
          // La carte la plus proche du sommet passe devant ses voisines.
          slot.style.zIndex = String(100 - Math.round(Math.abs(angle)));
        }

        const index = Math.round(turn / WHEEL_STEP_DEG);
        const clamped = Math.min(APPROACH_CARDS.length - 1, Math.max(0, index));
        if (clamped !== lastIndex) {
          lastIndex = clamped;
          setActiveIndex(clamped);
        }
      },
      { end: "+=380%" }
    );

    return () => trigger.kill();
  }, [plain]);

  const heroCopy = (
    <>
      <h1
        className="font-display text-kov-bone uppercase"
        style={{ fontSize: "clamp(30px, 6vw, 80px)", lineHeight: "var(--line-height-display)" }}
      >
        VOTRE VISION.
        <br />
        VOTRE SITE WEB<span className="text-kov-red">.</span>
      </h1>

      <p className="text-kov-concrete mx-auto mt-6 max-w-xl text-sm leading-relaxed md:mt-8 md:text-base">
        Création de site internet sur mesure, à Bordeaux : stratégie, design, développement et motion, tenus par un
        seul studio.
      </p>

      {/* Les projets d'abord, le rendez-vous ensuite : on regarde avant de
          s'engager. Le libellé est dans un <span> parce que le panneau qui
          monte au survol passerait devant un simple nœud de texte. */}
      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4 md:mt-12">
        <Link href="/#work-gallery" className="kov-hero-cta kov-hero-cta--light">
          <span>Voir les projets</span>
        </Link>
        <Link href="/contact" className="kov-hero-cta kov-hero-cta--red">
          <span>Prendre rendez-vous</span>
        </Link>
      </div>
    </>
  );

  // ── L'ÉCRAN ÉTROIT ET LE MOUVEMENT RÉDUIT ──────────────────────────
  //
  // Ni épinglage ni roue : la hero, puis les six cartes à la suite. Ce
  // n'est pas une version dégradée — une roue épinglée sur un téléphone
  // confisque le défilement pendant six écrans.
  if (plain) {
    return (
      <>
        <section id="hero" className="relative min-h-[88vh] overflow-hidden">
          <Nav variant="contained" />
          <div className="relative flex min-h-[88vh] items-center justify-center px-6 pt-24 pb-16">
            <div className="w-full max-w-[920px] text-center">{heroCopy}</div>
          </div>
        </section>

        <section id="showcase-immersive" className="kov-stage__plain">
          <h2 className="kov-stage__title">
            Un site qui
            <br />
            vous ressemble<span className="text-kov-red">.</span>
          </h2>
          <ul className="kov-stage__list">
            {APPROACH_CARDS.map((card, index) => (
              <li key={card.title}>
                <ActivationCard
                  number={String(index + 1).padStart(2, "0")}
                  total={APPROACH_CARDS.length}
                  title={card.title}
                  body={card.body}
                  features={card.features}
                  visual={<card.Visual reducedMotion={reducedMotion} active={false} />}
                  href={card.href}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  }

  return (
    <section ref={stageRef} id="hero" className="kov-stage">
      {/* Aucun fond ici : les ondes animées vivent au niveau de la page,
          pour passer derrière chaque section. */}
      <Nav variant="contained" />

      <div className="kov-stage__frame">
        <div ref={heroRef} className="kov-stage__hero">
          <div className="w-full max-w-[920px] text-center">{heroCopy}</div>
        </div>

        {/* Le titre de la roue. Un vrai h2, pas une décoration : la section
            a un nom. Le h1 au-dessus ne change jamais — il a été écrit pour
            le référencement — et les deux partagent la même échelle et la
            même cadence, ce qui fait lire une transformation. */}
        <div ref={headRef} className="kov-stage__head">
          <h2 className="kov-stage__title">
            Un site qui
            <br />
            vous ressemble<span className="text-kov-red">.</span>
          </h2>
        </div>

        <div
          ref={wheelRef}
          className="kov-stage__wheel"
          style={{ "--kov-wheel-radius": `${WHEEL_RADIUS}px` } as React.CSSProperties}
        >
          {APPROACH_CARDS.map((card, index) => (
            <div
              key={card.title}
              ref={(node) => {
                slotRefs.current[index] = node;
              }}
              className="kov-stage__slot"
              data-active={index === activeIndex || undefined}
              style={{ transform: `rotate(${index * ARC_STEP_DEG}deg) translateY(${-WHEEL_RADIUS}px)` }}
            >
              <ActivationCard
                number={String(index + 1).padStart(2, "0")}
                total={APPROACH_CARDS.length}
                title={card.title}
                body={card.body}
                features={card.features}
                visual={<card.Visual reducedMotion={reducedMotion} active={index === activeIndex} />}
                href={card.href}
                active={index === activeIndex}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen">
        <div className="pointer-events-auto">
          <HeroGlobalMenuButton />
        </div>
      </div>
    </section>
  );
}
