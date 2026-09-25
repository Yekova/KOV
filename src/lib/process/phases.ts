import { PROCESS } from "@/data/processSteps";

// Les sept phases KOV, dérivées de la méthode publiée sur le site.
//
// Elles existaient en deux exemplaires : `PROCESS` dans src/data/processSteps.ts
// (français, affiché sur la page d'accueil) et `KOV_DEFAULT_PHASES` dans
// src/lib/admin/status.ts (anglais, inséré dans project_phases). Comme le
// portail client lit project_phases, un client qui venait de lire
// « Découvrir → Structurer → Designer » sur le site ouvrait son espace et
// y trouvait « Discovery → Structure → Design ».
//
// Une seule source désormais, et c'est la version publiée : c'est celle que
// le client a déjà lue.
export const KOV_PHASES = PROCESS.map((step) => ({
  name: step.title,
  description: step.body,
}));

/** Les noms seuls, pour les appelants qui n'ont pas besoin du reste. */
export const KOV_PHASE_NAMES = KOV_PHASES.map((phase) => phase.name);
