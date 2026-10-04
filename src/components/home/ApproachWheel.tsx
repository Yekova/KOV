"use client";

import { useEffect, useRef, useState } from "react";
import { pinAndTrack } from "@/lib/motion";
import { ActivationCard } from "@/components/home/ActivationCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { APPROACH_CARDS, WHEEL_RADIUS, WHEEL_STEP_DEG } from "@/data/approachCards";
import "./approachWheel.css";

// La roue des six cartes d'approche.
//
// Elle remplace ActivationWindow (498 lignes : fenêtre macOS, colonne de
// gauche, coverflow horizontal, fondu au noir), supprimée sur décision du
// propriétaire au profit d'une géométrie unique — l'arc qui dépasse sous
// la hero EST le haut de cette roue.
//
// ── LA GÉOMÉTRIE N'EST PAS ICI ───────────────────────────────────────
//
// Rayon et pas angulaire vivent dans data/approachCards.ts, partagés avec
// HeroArc. Deux jeux de valeurs se décaleraient au premier réglage, et la
// continuité entre l'arc et la roue est précisément ce qui porte l'effet.
//
// ── LES TROIS TEMPS ──────────────────────────────────────────────────
//
//   0 → 0,80   la roue tourne, une carte au sommet à la fois
//   0,80 → 1   elle grossit et s'en va par le haut
//
// Le titre apparaît au début et part avec elle. Ce n'est PAS le h1 de la
// hero : celui-là ne bouge jamais, il a été écrit pour le référencement.
// C'est un vrai h2 — la section a un nom, et le lui retirer pour en faire
// une décoration casserait la structure de la page.
//
// ── CE QUI EST ÉCRIT DANS LE DOM, ET CE QUI NE L'EST PAS ─────────────
//
// Les transformations sont posées directement sur les nœuds à chaque
// image. Un état React par pixel de défilement provoquerait un rendu
// complet de six cartes et de leurs graphiques soixante fois par seconde.
// Seul l'index actif passe par un état — et uniquement quand il CHANGE,
// parce que lui pilote des props (bordure, rejeu du graphique).

/** La rotation totale : de la carte 0 au sommet jusqu'à la carte 5. */
const TURN_START_DEG = -WHEEL_STEP_DEG;
const TURN_END_DEG = (APPROACH_CARDS.length - 2) * WHEEL_STEP_DEG;

/** Où s'arrête la rotation et où commence la sortie, en progression. */
const EXIT_AT = 0.8;

/** La sortie : la roue grossit et monte. 1,55 et -42vh sont des points de
 *  départ — ils n'ont pas été vus à l'écran, aucun navigateur ne tourne
 *  sur ce projet. */
const EXIT_SCALE = 1.55;
const EXIT_RISE_VH = 42;

/**
 * L'entrée : la roue arrive d'en bas plutôt que d'apparaître à sa place.
 *
 * Sans ça, on voit DEUX objets : l'arc qui dépasse sous la hero, puis une
 * roue qui se pose ailleurs un écran plus bas. En la faisant monter depuis
 * la position où l'arc s'est arrêté, c'est le même objet qui continue sa
 * course — ce qui est ce qu'on attend d'une roue.
 *
 * 26vh est l'écart mesuré entre les deux centres de cercle sur un écran de
 * 1080, converti en hauteur d'écran pour tenir sur les autres. Comme tout
 * ce qui est géométrique ici, il n'a pas été vu et demandera une passe.
 */
const ENTER_DROP_VH = 26;
const ENTER_OVER = 0.15;

export function ApproachWheel() {
  const sectionRef = useRef<HTMLElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Deux raisons de ne pas épingler : un petit écran, où confisquer le
  // défilement pour six cartes est une punition ; et un visiteur qui a
  // demandé moins de mouvement.
  const compact = useMediaQuery("(max-width: 767px)");
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const plain = compact || reducedMotion;

  useEffect(() => {
    const section = sectionRef.current;
    const wheel = wheelRef.current;
    const head = headRef.current;
    if (plain || !section || !wheel || !head) return;

    let lastIndex = -1;

    const trigger = pinAndTrack(
      section,
      (progress) => {
        const turning = Math.min(1, progress / EXIT_AT);
        const turn = TURN_START_DEG + turning * (TURN_END_DEG - TURN_START_DEG);

        // La sortie ne commence qu'après EXIT_AT ; avant, ses deux valeurs
        // valent exactement leur état de repos.
        const leaving = Math.max(0, (progress - EXIT_AT) / (1 - EXIT_AT));
        const scale = 1 + leaving * (EXIT_SCALE - 1);
        const rise = leaving * EXIT_RISE_VH;

        // L'entrée et la sortie se composent sur le même axe : au début la
        // roue est encore basse (elle finit la montée de l'arc), à la fin
        // elle s'en va par le haut.
        const entering = Math.min(1, progress / ENTER_OVER);
        const drop = (1 - entering) * ENTER_DROP_VH;

        wheel.style.transform = `translate(-50%, ${drop - rise}vh) scale(${scale}) rotate(${-turn}deg)`;
        wheel.style.opacity = String(1 - leaving);

        // Le titre part avec la roue, un peu plus vite : il est plus haut
        // à l'écran, il doit sortir avant elle pour ne pas la croiser.
        head.style.transform = `translateY(${-rise * 1.3}vh)`;
        head.style.opacity = String(1 - leaving);

        // Quelle carte est au sommet. Arrondi, donc elle change au passage
        // du milieu entre deux crans — pas au tout début du mouvement.
        const index = Math.round((turn - TURN_START_DEG) / WHEEL_STEP_DEG);
        const clamped = Math.min(APPROACH_CARDS.length - 1, Math.max(0, index));
        if (clamped !== lastIndex) {
          lastIndex = clamped;
          setActiveIndex(clamped);
        }
      },
      // 6 cartes : assez de course pour qu'une carte ne passe pas en un
      // coup de molette, sans que la section devienne un tunnel.
      { end: "+=320%" }
    );

    return () => trigger.kill();
  }, [plain]);

  // ── L'ÉCRAN ÉTROIT, ET LE MOUVEMENT RÉDUIT ─────────────────────────
  //
  // Pas de roue, pas d'épinglage : les six cartes se suivent simplement.
  // Ce n'est pas une version dégradée, c'est la bonne forme ici — une roue
  // épinglée sur un téléphone confisque le défilement pendant six écrans.
  if (plain) {
    return (
      <section id="showcase-immersive" className="kov-wheel kov-wheel--plain">
        <h2 className="kov-wheel__title">
          Un site qui
          <br />
          vous ressemble<span className="text-kov-red">.</span>
        </h2>
        <ul className="kov-wheel__stack">
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
    );
  }

  return (
    <section ref={sectionRef} id="showcase-immersive" className="kov-wheel">
      <div className="kov-wheel__viewport">
        <div ref={headRef} className="kov-wheel__head">
          <h2 className="kov-wheel__title">
            Un site qui
            <br />
            vous ressemble<span className="text-kov-red">.</span>
          </h2>
        </div>

        <div
          ref={wheelRef}
          className="kov-wheel__wheel"
          style={{ "--kov-wheel-radius": `${WHEEL_RADIUS}px` } as React.CSSProperties}
        >
          {APPROACH_CARDS.map((card, index) => (
            <div
              key={card.title}
              className="kov-wheel__slot"
              data-active={index === activeIndex || undefined}
              style={{ transform: `rotate(${(index - 1) * WHEEL_STEP_DEG}deg) translateY(${-WHEEL_RADIUS}px)` }}
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
    </section>
  );
}
