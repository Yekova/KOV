import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

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

// The way in.
//
// One photograph, one statement, one card. What was here before was a
// sixty-frame image sequence that scrubbed with the cursor and a WebGL
// lightning bolt composited over it in screen blend — two moving surfaces
// and a megabyte of frames, on the one page in the site where the visitor
// has a single job and already knows what it is.
//
// The room does the atmosphere now, and it does it in a 129 KB still.
export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const nextParam = searchParams.next;
  const next = typeof nextParam === "string" ? nextParam : undefined;
  const justReset = searchParams.reset === "success";

  return (
    <main id="kov-main" tabIndex={-1} className="relative min-h-screen" style={{ background: "var(--kov-black)" }}>
      {/* priority: this is the page's only image and it is the page. */}
      <Image
        src="/kov/login/hall.webp"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "center 60%" }}
      />

      {/* Two scrims rather than one flat veil: a vertical one so the copy
          at the top and the corner mark at the bottom both sit on
          something, and a horizontal one that deepens toward the right
          where the card lands. The photograph keeps its own light in the
          middle, which is the whole reason to use it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.72) 0%, rgba(8,8,10,0.28) 34%, rgba(8,8,10,0.30) 62%, rgba(8,8,10,0.78) 100%), linear-gradient(90deg, rgba(8,8,10,0.66) 0%, rgba(8,8,10,0.12) 42%, rgba(8,8,10,0.55) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col justify-center gap-14 px-6 py-32 md:px-12 lg:flex-row lg:items-center lg:justify-between lg:gap-20 lg:py-36">
        <div className="max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-kov-red">KOV Studio</p>

          {/* The page's heading is the statement, not the card: the
              biggest thing on the screen and the first heading a screen
              reader reaches should be the same thing. */}
          <h1
            className="mt-7 font-display text-kov-bone"
            style={{ fontSize: "clamp(34px, 5vw, 66px)", lineHeight: 1.06, letterSpacing: "-0.025em" }}
          >
            Entrez dans
            <br />
            {/* The second line steps back so the first reads as the
                instruction and the second as the place. */}
            <span style={{ color: "var(--kov-concrete)" }}>un autre espace.</span>
          </h1>

          <span aria-hidden="true" className="mt-8 block h-px w-14 bg-kov-red" />

          <p className="mt-8 max-w-sm text-sm leading-relaxed text-kov-steel">
            Un lieu dédié à vos projets, vos documents et vos échanges avec l&apos;équipe. Connectez-vous pour
            reprendre où vous en étiez.
          </p>

          {/* The corner mark. Three verbs and a number, which is the
              site's own language — not a caption, and nothing it claims. */}
          <div className="mt-16 hidden lg:block">
            <p className="font-mono text-[11px] tabular-nums text-kov-bone">01</p>
            <p className="mt-3 font-mono text-[9px] uppercase leading-[1.9] tracking-[0.28em] text-kov-steel">
              Explorer
              <br />
              Imaginer
              <br />
              Construire
            </p>
          </div>
        </div>

        <div className="flex w-full justify-center lg:w-auto lg:justify-end">
          <LoginForm next={next} justReset={justReset} />
        </div>
      </div>
    </main>
  );
}
