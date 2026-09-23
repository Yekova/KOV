import type { Metadata } from "next";
import Link from "next/link";
import { StudioExperience } from "@/components/studio/StudioExperience";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Studio virtuel 360° : visitez nos espaces | KOV Bordeaux",
  description:
    "Visitez le studio KOV en 360° : des salles à parcourir, une navigation WebGL et un plan interactif. La démonstration de ce qu'on sait construire.",
  alternates: { canonical: `${SITE_URL}/studio` },
};

// /studio was the thinnest page on the site and its most impressive one at
// the same time: 259 words rendered, nav and chrome included, for the
// portfolio piece that proves the studio's technical level. It also takes
// internal links from two journal articles and from llms.txt and gave
// nothing back, because SiteChrome excludes /studio entirely, so the page
// had no footer and therefore no outgoing link at all.
//
// The owner asked for this to stay invisible to visitors, or very
// discreet. Discreet is done here; invisible is not, and deliberately so.
// Text hidden from people but served to crawlers (display:none, zero
// height, colour matched to the background, text parked behind a canvas)
// is a spam technique Google demotes sites for, and it would contradict
// every article this journal has published. What is discreet instead:
//
//   - the arrival is pixel-identical. The experience still fills the first
//     viewport, and nothing was added inside it,
//   - the prose sits after that first screen, so it is never in the way,
//   - one small link, bottom-left, leads to it. It is there because the
//     canvas calls preventDefault on wheel events to drive its own zoom,
//     so without an explicit control the section below would be
//     unreachable by scrolling, which is precisely the line not to cross.
//
// bottom-4 left-6 was chosen by elimination: the room carousel spans the
// full width at bottom-16, the pointer readout is centred at bottom-4 and
// desktop-only, the music player is pinned right. That corner is free.
export default function StudioPage() {
  return (
    <main>
      {/* Unchanged: one viewport, the experience filling it, overflow
          clipped. What changed is only that this is now a block in a
          normal page rather than the page itself being position:fixed. */}
      <div className="relative h-dvh w-full overflow-hidden">
        <StudioExperience />

        <Link
          href="#a-propos"
          className="absolute bottom-4 left-6 z-20 text-[11px] uppercase tracking-widest text-kov-steel/60 hover:text-kov-red transition-colors"
        >
          À propos du studio ↓
        </Link>
      </div>

      <section
        id="a-propos"
        className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32 max-w-[900px] mx-auto scroll-mt-8"
        style={{ background: "#050505" }}
      >
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
          <span aria-hidden="true" className="h-px w-7 bg-kov-red" />
          Le studio virtuel
        </p>

        <h2
          className="mt-7 font-display text-kov-bone uppercase"
          style={{ fontSize: "clamp(26px, 3.4vw, 44px)", lineHeight: 1.1 }}
        >
          Un lieu, pas une page
          <span className="text-kov-red">.</span>
        </h2>

        <div className="mt-8 space-y-5 text-kov-steel text-[15px] leading-[1.8]">
          <p>
            Ce que vous venez de parcourir n&apos;est pas une vidéo. C&apos;est un espace en trois dimensions qui se
            calcule dans votre navigateur, image par image, pendant que vous vous y déplacez. Rien à installer, aucune
            application, aucun greffon : une adresse suffit.
          </p>
          <p>
            Nous l&apos;avons construit pour une raison simple. Un studio qui dit savoir faire des expériences
            immersives et qui le prouve avec une page de texte demande qu&apos;on le croie sur parole. Celui-ci ne
            demande rien : il se visite. C&apos;est la seule forme de démonstration qui nous paraisse honnête.
          </p>
        </div>

        <h3 className="mt-14 font-display text-kov-bone uppercase text-lg">Comment il est fait</h3>
        <div className="mt-6 space-y-5 text-kov-steel text-[15px] leading-[1.8]">
          <p>
            Les salles panoramiques reposent sur des images à 360 degrés projetées à l&apos;intérieur d&apos;une sphère,
            avec une caméra placée en son centre : vous ne tournez pas autour du décor, vous êtes dedans. La galerie des
            marques, elle, est une pièce entièrement modélisée, avec ses volumes, ses collisions et son éclairage, que
            l&apos;on traverse à pied.
          </p>
          <p>
            Le tout tourne sur WebGL, la couche qui permet à une page web de parler à la carte graphique, avec Three.js
            par-dessus pour manipuler des caméras, des matériaux et des lumières plutôt que des matrices. Ce que ça
            impose en retour, du poids à charger au fait qu&apos;une scène ne contient aucun texte lisible par un
            moteur de recherche, nous l&apos;avons écrit sans rien enjoliver dans notre article sur la{" "}
            <Link href="/journal/webgl-three-js-3d-temps-reel-navigateur" className="text-kov-red hover:text-kov-bone transition-colors underline underline-offset-2">
              3D temps réel dans un navigateur
            </Link>
            .
          </p>
          <p>
            Cette page en est d&apos;ailleurs l&apos;illustration : l&apos;expérience au-dessus est invisible pour une
            machine, et c&apos;est exactement pour ça que ce texte existe ici, sous elle, plutôt que nulle part.
          </p>
        </div>

        <h3 className="mt-14 font-display text-kov-bone uppercase text-lg">Ce que ça dit de notre façon de travailler</h3>
        <div className="mt-6 space-y-5 text-kov-steel text-[15px] leading-[1.8]">
          <p>
            Qu&apos;un site peut être un lieu plutôt qu&apos;un document, quand le sujet le mérite. Que la performance
            n&apos;est pas une case à cocher à la fin mais une contrainte qui décide de la forme dès le premier
            arbitrage. Et qu&apos;une démonstration vaut mieux qu&apos;une promesse, y compris quand elle expose ses
            propres limites.
          </p>
          <p>
            Tout ce qui est ici a été conçu et construit par le même studio, de la direction artistique au code. C&apos;est
            aussi ce qui nous permet d&apos;en parler sans intermédiaire quand vous nous posez une question technique.
          </p>
        </div>

        <div className="mt-14 border-t pt-10 flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-8" style={{ borderColor: "var(--kov-border)" }}>
          <Link href="/creation-site-internet" className="text-sm text-kov-bone hover:text-kov-red transition-colors">
            Créer votre site →
          </Link>
          <Link href="/projets" className="text-sm text-kov-bone hover:text-kov-red transition-colors">
            Nos réalisations →
          </Link>
          <Link href="/journal/visite-virtuelle-site-internet" className="text-sm text-kov-bone hover:text-kov-red transition-colors">
            Faut-il une visite virtuelle ? →
          </Link>
          <Link href="/contact" className="text-sm text-kov-bone hover:text-kov-red transition-colors">
            Nous écrire →
          </Link>
        </div>
      </section>
    </main>
  );
}
