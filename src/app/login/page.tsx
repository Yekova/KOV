import type { Metadata } from "next";
import { LiquidReveal } from "@/components/projects/LiquidReveal";
import { LoginCarousel } from "./LoginCarousel";
import { LoginForm } from "./LoginForm";
import "./login.css";

export const metadata: Metadata = {
  title: "Connexion — KOV",
  description: "Connexion à l'espace client ou admin KOV.",
  alternates: { canonical: "https://kov-agency.site/login" },
  // noindex rather than a robots.txt Disallow.
  //
  // Disallow and noindex are not the same instruction and were being used as
  // if they were: a disallowed URL that is linked from somewhere — and this
  // one is linked from the footer of every page — can still be indexed, as a
  // bare URL with no title and no snippet, because the crawler is forbidden
  // from fetching the page that would have told it not to. Letting it be
  // crawled and answering noindex is the only way the instruction is ever
  // read. follow:true so the links out of here still count.
  robots: { index: false, follow: true },
};

// L'entrée.
//
// Une seule carte, centrée, coupée en deux : les images à gauche, le
// formulaire à droite. C'est la composition de la maquette de référence,
// transposée dans l'identité KOV — qui est sombre et fixe (voir
// docs/KOV-BRAND.md), donc la carte est une surface graphite et non la
// plaque blanche du modèle. Le contraste que la maquette tirait du blanc,
// celui-ci le tire des photographies : elles sont la seule chose lumineuse
// de l'écran.
//
// Ce qui a disparu au passage : le fond plein cadre qui dérivait à la
// souris (LoginBackdrop). Le sol est maintenant celui de /projets — le
// même composant, la même image, le même geste : noir, sauf sous le
// curseur. Une photographie fixe derrière une carte qui contient déjà des
// images, c'étaient deux surfaces qui se disputaient le même regard ;
// celle-ci ne se montre que si on la cherche.
export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const nextParam = searchParams.next;
  const next = typeof nextParam === "string" ? nextParam : undefined;
  const justReset = searchParams.reset === "success";
  // Ce avec quoi /api/auth/callback renvoie ici quand une connexion par
  // fournisseur ne débouche pas sur une session.
  const errorParam = typeof searchParams.error === "string" ? searchParams.error : null;
  const notice =
    errorParam === "not-invited"
      ? "Cet espace est accessible sur invitation. Demandez un accès à votre interlocuteur KOV."
      : errorParam === "oauth"
        ? "La connexion avec ce service n'a pas abouti."
        : null;

  // Pas de background sur <main>, et c'est une contrainte, pas un oubli :
  // LiquidReveal peint sur un calque en z-index -1, qui passe sous le
  // contenu en flux mais au-dessus du seul fond de la racine. <main> est
  // ici positionné (relative), donc son fond à lui se peindrait par-dessus
  // le calque et l'effacerait. Le noir vient du <body>, comme sur /projets.
  return (
    <main id="kov-main" tabIndex={-1} className="relative min-h-screen">
      {/* Le même sol que /projets, et le même composant : noir, sauf
          exactement sous le curseur, où un disque doux découvre l'image.
          Rien n'est peint tant que la souris n'a pas bougé, et rien ne
          reste après son passage.
          
          Un écran tactile n'a pas de curseur : le composant ne rend alors
          rien du tout, et la page reste sur son noir. */}
      <LiquidReveal />

      <div className="relative z-[1] mx-auto flex min-h-screen w-full max-w-[1180px] items-center justify-center px-5 py-28 sm:px-6 lg:py-32">
        <div className="kov-login-card w-full">
          <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
            {/* Le panneau d'images. Sa hauteur vient de la grille sur grand
                écran — donc du formulaire, la plus haute des deux colonnes —
                et d'une min-height en dessous, où il devient une bannière
                au-dessus du formulaire plutôt qu'une colonne à côté. */}
            <div className="kov-login-panel relative min-h-[260px] sm:min-h-[300px] lg:min-h-0">
              <LoginCarousel />
            </div>

            <div className="flex items-center px-6 py-9 sm:px-9 sm:py-11 lg:px-11 lg:py-12">
              <LoginForm next={next} justReset={justReset} notice={notice} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
