"use client";

import { useEffect, useRef } from "react";
import { ActivationCard } from "@/components/home/ActivationCard";
import { APPROACH_CARDS, ARC_CARDS, ARC_PEEK, ARC_STEP_DEG, WHEEL_RADIUS } from "@/data/approachCards";
import "./heroArc.css";

// Les trois cartes qui dépassent sous la hero.
//
// ── CE QU'ELLES SONT ─────────────────────────────────────────────────
//
// Le haut d'une roue dont le centre est très en dessous de l'écran. Elles
// ne sont pas posées côte à côte puis inclinées : elles sont placées sur
// un cercle, exactement comme celles de la roue qui prend la suite, avec
// le même rayon et le même pas angulaire (voir data/approachCards.ts).
// C'est la condition pour que le passage de l'une à l'autre ne se voie
// pas comme une cassure.
//
// On n'en voit que ARC_PEEK pixels — un tiers de carte. Assez pour
// deviner un objet, trop peu pour le lire. C'est le suspens demandé.
//
// ── LE MOUVEMENT ─────────────────────────────────────────────────────
//
// Elles montent à mesure qu'on descend. L'écriture se fait directement
// sur le style du nœud, dans une boucle d'animation — pas dans un état
// React, qui provoquerait un rendu complet à chaque pixel de défilement.
// C'est le motif déjà employé par CustomCursor et par les sections
// défilées de ce site.
//
// Sous 768 px, ce composant ne rend rien du tout : décision prise avec le
// propriétaire, la hero mobile reste du texte seul.

/** De combien de pixels les cartes montent au maximum, et sur quelle
 *  distance de défilement. Au-delà, la section de la roue prend le relais. */
const RISE_PX = 260;
const RISE_OVER_PX = 620;

export function HeroArc() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      // clamp plutôt que min/max imbriqués : la valeur doit rester entre 0
      // et RISE_PX même si le navigateur restaure un défilement négatif
      // (rebond iOS) au chargement.
      const progress = Math.min(1, Math.max(0, window.scrollY / RISE_OVER_PX));
      host.style.setProperty("--arc-rise", `${-progress * RISE_PX}px`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="kov-arc"
      aria-hidden="true"
      // Posées ici plutôt qu'écrites dans la feuille de style : la
      // géométrie a UNE source, data/approachCards.ts, et la roue lit les
      // mêmes constantes. Deux nombres recopiés dans un CSS se
      // désaccorderaient au premier réglage.
      style={
        {
          "--kov-wheel-radius": `${WHEEL_RADIUS}px`,
          "--kov-arc-peek": `${ARC_PEEK}px`,
        } as React.CSSProperties
      }
    >
      {ARC_CARDS.map((card, index) => {
        // L'index 1 est au sommet de l'arc ; -1 et +1 de part et d'autre.
        // ARC_STEP_DEG et non le pas de la roue : ici les cartes se
        // chevauchent en éventail, et elles ne forment un bloc que parce
        // qu'elles se mordent.
        const angle = (index - 1) * ARC_STEP_DEG;
        return (
          <div
            key={card.title}
            className="kov-arc__slot"
            style={{
              // Le même enchaînement que la roue : on tourne autour du
              // centre, on remonte du rayon, et la carte garde
              // l'inclinaison de l'arc — c'est elle qui fait lire un
              // cercle plutôt qu'une rangée.
              transform: `rotate(${angle}deg) translateY(${-WHEEL_RADIUS}px)`,
              // Celle du milieu passe devant, et les voisines derrière,
              // dans l'ordre : sans cet empilement explicite, l'ordre du
              // DOM mettrait la troisième au-dessus des deux autres et
              // l'éventail se lirait à l'envers.
              zIndex: index === 1 ? 2 : 1,
            }}
          >
            <ActivationCard
              number={String(index + 1).padStart(2, "0")}
              total={APPROACH_CARDS.length}
              title={card.title}
              body={card.body}
              features={card.features}
              // Les graphiques ne s'animent pas dans l'arc : il est coupé
              // aux deux tiers et personne ne les verra. Les rejouer ici
              // ferait tourner six compositions hors de l'écran.
              visual={<card.Visual reducedMotion active={false} />}
              active={index === 1}
            />
          </div>
        );
      })}
    </div>
  );
}

export { ARC_PEEK };
