import Link from "next/link";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { Reveal } from "@/components/ui/Reveal";
import { HeroArc } from "@/components/home/HeroArc";
import "@/components/home/heroCta.css";

// Le premier écran : une affiche.
//
// ── CE QU'IL Y AVAIT, ET POURQUOI IL N'Y EST PLUS ────────────────────
//
// Une composition en deux colonnes, avec à droite une grille bento de
// sept widgets déplaçables — glisser-déposer natif, persistance locale,
// un millier de lignes. Elle est supprimée, par décision du propriétaire,
// et la mesure qui a emporté la décision tient en une ligne :
//
//   TOUT ce que cette grille montrait a déjà sa propre section plus bas.
//   Projets, studio, expertise, contact : quatre sections entières, dont
//   la grille n'était qu'un avant-goût plus petit et moins lisible.
//
// Seule la vidéo de maquette responsive lui était propre. Elle a déménagé
// dans ScreenShowcase, où la section affirme déjà « Responsive pensé dès
// le départ » — une démonstration à la place d'une affirmation.
//
// ── CE QUE ÇA CHANGE POUR CE FICHIER ─────────────────────────────────
//
// Il n'interroge plus la base. Les deux lectures qu'il faisait — le
// dernier article du journal, le projet mis en avant — ne servaient qu'aux
// widgets. Le premier écran de la page d'accueil ne dépend donc plus
// d'aucune requête, ce qui est la meilleure chose qui puisse lui arriver.
//
// ── CE QUI PORTE L'ÉCRAN, MAINTENANT QU'IL EST VIDE ──────────────────
//
// Trois choses, et c'est tout : le titre, une phrase, deux actions. Pas
// d'œil-de-bœuf au-dessus — dans une composition centrée, un quatrième
// élément dilue les trois autres, et le point rouge du titre devient le
// seul accent de couleur de l'écran.
//
// Le mouvement se joue une fois, au chargement, ligne par ligne. Reveal
// est un composant de défilement, mais la hero est déjà visible à
// l'arrivée : son observateur se déclenche immédiatement, ce qui en fait
// exactement l'apparition voulue sans écrire une seconde animation. Il
// respecte prefers-reduced-motion, donc ce choix-là est déjà fait.
export function HeroScene() {
  return (
    <section id="hero" className="relative min-h-[88vh] md:min-h-screen overflow-hidden">
      {/* Aucun fond ici, volontairement : les ondes animées vivent au
          niveau de la page (src/app/page.tsx) pour passer derrière chaque
          section. Un fond opaque les masquerait sur toute la hauteur du
          premier écran. Elles ont été ramenées au seuil du perceptible
          plutôt que supprimées — voir le commentaire de page.tsx. */}

      <Nav variant="contained" />

      <div
        className="relative flex min-h-[88vh] items-center justify-center px-6 pt-24 pb-16 md:min-h-screen md:px-16 md:pt-28"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="w-full max-w-[920px] text-center">
          {/* Le plancher de 30 px est repris tel quel de la version
              précédente, et ce n'est pas de la prudence : « VOTRE SITE
              WEB. » contient un W, le glyphe le plus large d'Archivo
              Black, contre environ 327 px utiles sur un écran de 375 px.
              À 34 px la ligne passait à deux doigts du retour, et un titre
              avec un <br/> explicite qui revient quand même à la ligne se
              lit comme un bug.
              6vw ne dépasse 30 px qu'à partir de 500 px de large : en
              dessous, la mesure d'origine est intacte. Au-dessus, le
              plafond passe de 56 à 80 px — le titre devient l'objet qui
              remplace l'image retirée. */}
          <Reveal delay={0}>
            <h1
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(30px, 6vw, 80px)", lineHeight: "var(--line-height-display)" }}
            >
              VOTRE VISION.
              <br />
              VOTRE SITE WEB<span className="text-kov-red">.</span>
            </h1>
          </Reveal>

          {/* Les mots qu'un acheteur tape réellement. Mesuré avant d'être
              écrit : la page d'accueil disait « création de site » zéro
              fois en 2446 mots. */}
          <Reveal delay={110}>
            <p className="text-kov-concrete mx-auto mt-6 max-w-xl text-sm leading-relaxed md:mt-8 md:text-base">
              Création de site internet sur mesure, à Bordeaux : stratégie, design, développement et motion, tenus
              par un seul studio.
            </p>
          </Reveal>

          {/* Deux actions, hiérarchisées. La seconde n'est plus une
              pastille : deux pastilles côte à côte se partagent l'attention
              alors qu'une seule action compte ici. Elle reste un vrai lien,
              à hauteur de doigt, simplement sans la promesse visuelle d'un
              bouton. */}
          {/* Les projets d'abord, le rendez-vous ensuite : on regarde avant
              de s'engager. Les deux sont de vrais boutons et ils échangent
              leurs couleurs au survol — le libellé est enveloppé dans un
              <span> parce que le panneau qui monte passerait devant un
              simple nœud de texte (voir heroCta.css).

              « Prendre rendez-vous » mène à /contact, comme partout
              ailleurs sur le site : aucun calendrier n'existe, et le
              formulaire est déjà un cadrage en cinq étapes. */}
          <Reveal delay={220}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4 md:mt-12">
              <Link href="/#work-gallery" className="kov-hero-cta kov-hero-cta--light">
                <span>Voir les projets</span>
              </Link>
              <Link href="/contact" className="kov-hero-cta kov-hero-cta--red">
                <span>Prendre rendez-vous</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Les trois cartes qui dépassent. Elles décrivent le même cercle
          que la roue de la section suivante — même rayon, même pas
          angulaire — pour que le passage de l'une à l'autre ne se lise pas
          comme une cassure. Rien à régler ici : la géométrie est dans
          data/approachCards.ts, partagée. */}
      <HeroArc />

      {/* Hors du flux centré : le bouton de menu global est posé sur
          l'écran, pas dans la composition. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-screen">
        <div className="pointer-events-auto">
          <HeroGlobalMenuButton />
        </div>
      </div>
    </section>
  );
}
