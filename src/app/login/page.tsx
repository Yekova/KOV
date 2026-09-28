import type { Metadata } from "next";
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
// souris (LoginBackdrop). Sa photographie n'est pas perdue, elle est
// devenue la deuxième vue du carrousel. Une image de fond qui bouge
// derrière une carte qui contient déjà des images, ce sont deux surfaces
// qui se disputent le même regard.
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

  return (
    <main id="kov-main" tabIndex={-1} className="relative min-h-screen" style={{ background: "var(--kov-black)" }}>
      {/* Le fond.

          Deux halos, et aucun n'est rouge. Le rouge est la couleur de
          signal du site : il est ici sur une seule chose, le bouton qui
          soumet le formulaire, et il ne peut pas l'être tant qu'il est
          aussi la décoration du décor. Celui du haut ouvre l'espace
          derrière la carte, celui du bas le referme sous le pied de page.

          fixed : le pied de page est un frère de <main>, donc un calque
          absolu ici ne peindrait rien sous lui. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 70% at 50% -10%, rgba(150,158,172,0.16) 0%, rgba(10,10,10,0) 58%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(80% 55% at 50% 108%, rgba(0,0,0,0.85) 0%, rgba(10,10,10,0) 68%)",
          }}
        />
      </div>

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
