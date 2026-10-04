import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDesignActivity, getValidationBoard } from "@/lib/design/queries";
import { markValidationSeen } from "@/lib/clients/onboarding";
import { ValidationWorkspace } from "@/components/design/ValidationWorkspace";

export async function generateMetadata(
  props: PageProps<"/client/projects/[id]/validation">
): Promise<Metadata> {
  const { id } = await props.params;
  const user = await requireUser();
  const board = await getValidationBoard(id, { kind: "client", id: user.id });
  return { title: board ? `Validation — ${board.projectName} — KOV` : "Validation — KOV" };
}

export default async function ClientValidationPage(props: PageProps<"/client/projects/[id]/validation">) {
  const { id } = await props.params;
  const user = await requireUser();

  // getValidationBoard rend null pour un projet qui n'est pas le sien :
  // la vérification d'appartenance est dans la requête, pas ici, pour que
  // les deux côtés en héritent.
  const board = await getValidationBoard(id, { kind: "client", id: user.id });
  if (!board) notFound();

  const activity = await getDesignActivity(id);

  // Le studio saura que le client a ouvert l'espace de validation (§43).
  // Écrit ici et non dans un effet du navigateur : une page serveur sait
  // qu'elle est rendue, un effet peut ne jamais partir — onglet fermé
  // avant l'hydratation, script bloqué, lecteur d'écran en mode document.
  //
  // Attendue, et non lâchée : une promesse abandonnée dans un composant
  // serveur peut ne jamais aboutir, la requête se terminant avant elle.
  // Le `catch` garde la propriété qui comptait — une écriture de confort
  // n'a aucune raison de faire tomber la page qu'elle accompagne.
  await markValidationSeen(user.id).catch(() => {});

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-8 md:px-10">
      <header className="mb-6">
        <Link
          href={`/client/projects/${id}`}
          className="text-kov-steel hover:text-kov-red text-[11px] tracking-widest uppercase transition-colors"
        >
          ← {board.projectName}
        </Link>
        <h1
          className="font-display text-kov-bone mt-3 uppercase"
          style={{ fontSize: "var(--heading-md)", lineHeight: "var(--line-height-display)" }}
        >
          Validation des maquettes<span className="text-kov-red">.</span>
        </h1>
        <p className="text-kov-concrete mt-3 max-w-xl text-sm leading-relaxed">
          Cliquez sur une maquette à l&apos;endroit qui vous gêne pour y déposer un retour. KOV le traite, publie une
          nouvelle version, et vous validez.
        </p>
      </header>

      <ValidationWorkspace initialBoard={board} activity={activity} />
    </main>
  );
}
