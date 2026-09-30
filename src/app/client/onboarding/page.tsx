import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { getOnboarding, resumeAt } from "@/lib/clients/onboarding";
import { deriveCurrentPhase, type ProjectPhase } from "@/lib/portal/progress";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = { title: "Bienvenue — KOV" };

export default async function ClientOnboardingPage() {
  const user = await requireUser();

  const [{ data: profile }, state] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select(
        "full_name, company, email, phone, display_title, address_street, address_postal_code, address_city, address_country, created_at, account_manager_id"
      )
      .eq("id", user.id)
      .maybeSingle(),
    getOnboarding(user.id),
  ]);

  // Le projet principal : le plus récent. Un client qui n'en a pas encore
  // traverse quand même le parcours — l'étape le dit, elle ne ment pas
  // sur un projet qui n'existe pas (§49).
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, name, category, status, progress_percent, project_phases(id, name, status, position, description, start_date, due_date)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: manager }, { count: validationPages }] = await Promise.all([
    profile?.account_manager_id
      ? supabaseAdmin
          .from("profiles")
          .select("full_name, display_title, avatar_path")
          .eq("id", profile.account_manager_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    project
      ? supabaseAdmin
          .from("design_pages")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("visible_to_client", true)
      : Promise.resolve({ count: 0 }),
  ]);

  const phases = [...((project?.project_phases ?? []) as ProjectPhase[])].sort((a, b) => a.position - b.position);
  const currentPhase = project ? deriveCurrentPhase(phases, null) : null;

  return (
    <main className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10">
      <OnboardingFlow
        startAt={resumeAt(state)}
        state={state}
        profile={{
          fullName: profile?.full_name ?? null,
          company: profile?.company ?? null,
          email: profile?.email ?? user.email ?? null,
          phone: profile?.phone ?? null,
          jobTitle: profile?.display_title ?? null,
          street: profile?.address_street ?? null,
          postalCode: profile?.address_postal_code ?? null,
          city: profile?.address_city ?? null,
          country: profile?.address_country ?? null,
          createdAt: profile?.created_at ?? null,
        }}
        manager={
          manager
            ? {
                fullName: manager.full_name,
                title: manager.display_title,
                avatarUrl: getPublicAssetUrl(manager.avatar_path),
              }
            : null
        }
        project={
          project
            ? {
                id: project.id,
                name: project.name,
                category: project.category,
                statusLabel: PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status,
                phaseName: currentPhase?.label ?? null,
                progressPercent: project.progress_percent,
                // L'espace de validation n'est annoncé que s'il contient
                // quelque chose : un bouton vers un écran vide est une
                // promesse que la page ne tient pas (§42).
                hasValidation: (validationPages ?? 0) > 0,
              }
            : null
        }
      />
    </main>
  );
}
