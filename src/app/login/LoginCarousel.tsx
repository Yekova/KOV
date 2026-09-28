"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** How long a slide holds before the next one takes over. */
const HOLD_MS = 6000;

type Slide = {
  src: string;
  /** The mono index drawn above the caption. */
  index: string;
  title: string;
  line: string;
};

// Trois salles, et ce que chacune représente.
//
// Les images viennent du site lui-même : le couloir et l'atrium sont ceux
// du menu global, la salle à la ligne rouge est la photographie qui servait
// de fond plein cadre à cette page jusqu'ici. Elles ont été recadrées en
// portrait (1000x1250) dans public/kov/login/carousel/ — rien n'est
// téléchargé depuis un tiers, rien n'est une banque d'images.
//
// Pour changer une image : déposer le fichier à côté des trois autres et
// changer `src` ici. Le reste du composant ne connaît rien de son contenu.
//
// Les légendes nomment ce que l'espace contient vraiment — projets, devis,
// factures, documents — et s'arrêtent là. Aucun chiffre, aucune promesse.
const SLIDES: readonly Slide[] = [
  {
    src: "/kov/login/carousel/01-couloir.webp",
    index: "01",
    title: "Votre projet, phase par phase.",
    line: "L'avancement, tenu à jour par le studio.",
  },
  {
    src: "/kov/login/carousel/02-hall.webp",
    index: "02",
    title: "Devis et factures, au même endroit.",
    line: "Consultables à tout moment.",
  },
  {
    src: "/kov/login/carousel/03-atrium.webp",
    index: "03",
    title: "Vos documents, réunis.",
    line: "Livrables et pièces du projet.",
  },
];

// Le panneau gauche de la carte.
//
// Un fondu enchaîné, pas un défilement : trois images sans lien entre elles
// n'ont pas d'axe commun, donc rien qui justifie qu'elles glissent dans une
// direction. Elles se remplacent.
//
// Il s'arrête tout seul dans trois cas — au survol, quand le clavier entre
// dedans, et sous prefers-reduced-motion. Le premier parce qu'un carrousel
// qui tourne pendant qu'on le regarde vous prend l'image des yeux ; le
// deuxième parce qu'on ne déplace pas ce que quelqu'un est en train de
// parcourir au clavier ; le troisième parce que c'est du mouvement
// automatique, et c'est exactement ce que ce réglage demande d'éteindre.
export function LoginCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const still = reduced || paused;

  const go = useCallback((index: number) => setActive(index), []);

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % SLIDES.length), HOLD_MS);
    return () => window.clearInterval(id);
  }, [still]);

  const slide = SLIDES[active];

  return (
    <div
      // absolute plutôt que h-full : le panneau qui l'accueille tire sa
      // hauteur de la grille (donc du formulaire) sur grand écran et d'une
      // min-height sur téléphone. Un pourcentage de hauteur aurait deux
      // références différentes selon le cas ; inset-0 n'en a qu'une.
      className="absolute inset-0 isolate overflow-hidden"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {SLIDES.map((item, index) => (
        <div
          key={item.src}
          aria-hidden={index !== active}
          className="kov-login-slide absolute inset-0"
          style={{
            opacity: index === active ? 1 : 0,
            // L'image sortante est légèrement plus grande : au fondu, elle
            // recule au lieu de disparaître. Sous reduced-motion il ne
            // reste que l'opacité.
            transform: reduced ? undefined : index === active ? "scale(1)" : "scale(1.05)",
          }}
        >
          {/* alt vide, et c'est délibéré : la légende juste en dessous dit
              ce que l'image est là pour dire, et une description de salle
              lue à voix haute trois fois de suite n'ajouterait rien à un
              écran de connexion. */}
          <Image
            src={item.src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 520px"
            priority={index === 0}
            className="object-cover"
          />
        </div>
      ))}

      {/* Le voile. Le couloir a un sol clair en bas au centre : sans lui la
          légende s'y perdrait. Il monte jusqu'à mi-hauteur, pas plus, pour
          que l'image garde sa propre lumière. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(6,6,7,0.94) 0%, rgba(6,6,7,0.62) 24%, rgba(6,6,7,0.12) 52%, rgba(6,6,7,0.28) 100%)",
        }}
      />

      {/* Les écritures, en bas à gauche. */}
      <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
        <div key={active} className="kov-login-caption">
          <p className="font-mono text-[10px] tabular-nums tracking-[0.3em] text-kov-steel">
            {slide.index}
            <span className="text-kov-muted"> / {SLIDES.length.toString().padStart(2, "0")}</span>
          </p>
          <p
            className="mt-3 max-w-[22ch] font-display text-kov-bone"
            style={{ fontSize: "clamp(18px, 1.5vw, 23px)", lineHeight: 1.22, letterSpacing: "-0.015em" }}
          >
            {slide.title}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-kov-concrete/80">{slide.line}</p>
        </div>

        {/* Les trois barres. Ce sont des boutons : le carrousel se conduit,
            il ne se subit pas. La barre active se remplit sur la durée du
            palier, ce qui dit à la fois où on en est et combien de temps
            il reste — un point ne dit ni l'un ni l'autre. */}
        <div className="mt-7 flex items-center gap-2">
          {SLIDES.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => go(index)}
              aria-label={`Image ${index + 1} sur ${SLIDES.length} — ${item.title}`}
              aria-current={index === active}
              className="kov-login-dot relative h-6 w-9 shrink-0"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full"
                style={{ background: "rgba(231,231,229,0.22)" }}
              >
                {index === active && (
                  <span
                    // Rendu seulement dans le bouton actif, donc React le
                    // démonte et le remonte à chaque changement de vue —
                    // et une animation CSS ne rejoue que remontée.
                    className={reduced ? "block h-full w-full" : "kov-login-progress block h-full w-full"}
                    style={{
                      background: "var(--kov-red)",
                      animationDuration: `${HOLD_MS}ms`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
