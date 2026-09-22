import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { fetchShowcaseProjectById } from "@/lib/showcase/projects";
import { ProjectsView } from "@/components/projects/ProjectsView";
import "@/components/projects/ProjectsPage.css";

export const metadata: Metadata = {
  title: "Aperçu — Réalisation",
  robots: { index: false, follow: false },
};

// Reading a draft before it is public.
//
// Deliberately outside /admin — that prefix gets the admin sidebar and
// topbar, which would make this look nothing like the real page. Living
// here means SiteChrome wraps it in the actual public nav and footer, which
// is the point: an approval is worth what the thing being approved looks
// like. Same reasoning as /journal/preview/[id], which set the precedent.
//
// Gated by requireAdmin() itself, since there is no /admin prefix for the
// proxy to recognise.
//
// It renders the real ProjectsView with one project in it rather than a
// preview-shaped imitation, so the card, its frame, its buttons and the
// sheet behind them are the components a visitor gets — not lookalikes that
// can drift.
export default async function ProjectPreviewPage(props: PageProps<"/projets/preview/[id]">) {
  await requireAdmin();
  const { id } = await props.params;

  const project = await fetchShowcaseProjectById(id);
  if (!project) notFound();

  return (
    <main id="kov-main" tabIndex={-1} className="kov-pw">
      <div
        className="fixed inset-x-0 top-0 z-50 px-6 py-2 text-center text-xs uppercase tracking-widest"
        style={{ background: "var(--kov-red)", color: "var(--kov-white)" }}
      >
        Aperçu · {project.status === "live" ? "réalisation livrée" : "entrée à venir"} ·{" "}
        <Link href={`/admin/realisations/${id}`} className="underline underline-offset-4">
          retourner à l&apos;édition
        </Link>
      </div>

      <header className="kov-pw__head">
        <p className="kov-pw__label">
          <span aria-hidden="true" />
          Aperçu
        </p>
        <h1 className="kov-pw__title">{project.name}</h1>
        <p className="kov-pw__lede">
          Exactement ce qu&apos;un visiteur verrait. La fiche s&apos;ouvre au clic, comme en ligne.
        </p>
      </header>

      <ProjectsView projects={[project]} />
    </main>
  );
}
