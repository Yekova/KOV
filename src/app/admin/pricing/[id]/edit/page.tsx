import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOldestBenchmarkDate, getPricingCatalog } from "@/lib/pricing/catalog";
import {
  PricingConfigurator,
  type ConfiguratorPerson,
} from "@/app/admin/pricing/new/PricingConfigurator";
import type { PricingConditions, PricingSelection } from "@/lib/pricing/types";

export const metadata: Metadata = { title: "Modifier le chiffrage — Admin KOV" };

// La modification d'un chiffrage.
//
// ── POURQUOI CET ÉCRAN EST LE MÊME QUE LA CRÉATION ───────────────────────
//
// Un chiffrage, ce sont une quarantaine de champs liés : l'offre décide des
// modules, les modules décident des jours, les jours décident de la marge,
// la marge décide des alertes. Un second formulaire « édition » aurait
// dupliqué tout ça, et les deux auraient divergé au premier module ajouté —
// sur l'écran qu'on utilise le moins, donc sans qu'on le voie.
//
// C'est donc le configurateur, rempli.
//
// ── CE QUI RESTE FIGÉ ────────────────────────────────────────────────────
//
// La version tarifaire. On modifie avec les paramètres qui ont servi à
// chiffrer, jamais avec ceux du jour : changer de version re-tarife tout en
// silence, et le prix affiché ne serait plus celui qu'on croyait corriger.
// Repartir sur une autre année, c'est « Dupliquer en v+1 ».

export default async function EditPricingPage({ params }: PageProps<"/admin/pricing/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("pricing_configurations")
    .select("id, title, segment, status, quote_id, settings_version_id, client_id, lead_id, selection, conditions")
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  // Le même refus que le serveur d'enregistrement, mais dit AVANT d'avoir
  // fait recocher quarante cases pour rien. Le garde qui compte reste
  // celui de saveConfiguration : celui-ci est une politesse, pas une
  // sécurité, et les deux doivent le rester chacun de leur côté.
  if (row.quote_id || row.status !== "draft") {
    return (
      <main className="px-6 py-10 max-w-3xl mx-auto w-full">
        <Link
          href={`/admin/pricing/${id}`}
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← {row.title as string}
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Ce chiffrage ne se modifie plus</h1>
        <p className="text-kov-steel text-sm mt-4 max-w-prose">
          {row.quote_id
            ? "Un devis a été généré à partir de lui. Ce devis porte un numéro, il est peut-être déjà parti, et ce chiffrage est la seule chose qui explique son prix : le réécrire laisserait un document que plus personne ne saurait justifier."
            : "Il est marqué perdu. Son motif de perte est ce qu'on relira pour comprendre ce qui n'a pas abouti, et il doit rester en face de ce qui a été proposé."}
        </p>
        <p className="text-kov-steel text-sm mt-3 max-w-prose">
          Pour repartir de lui sans y toucher : <strong className="text-kov-bone">Dupliquer en v+1</strong>{" "}
          depuis sa fiche.
        </p>
      </main>
    );
  }

  const catalog = await getPricingCatalog(row.settings_version_id as string);
  if (!catalog) notFound();

  const clientId = row.client_id as string | null;
  const leadId = row.lead_id as string | null;

  const [oldestBenchmark, { data: clientRows }, { data: leadRows }] = await Promise.all([
    getOldestBenchmarkDate(),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, company, archived_at")
      .eq("role", "client")
      .order("full_name", { ascending: true }),
    supabaseAdmin
      .from("leads")
      .select("id, name, company, converted_profile_id")
      .is("converted_profile_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const clients: ConfiguratorPerson[] = (clientRows ?? [])
    .filter((entry) => !entry.archived_at)
    .map((entry) => ({
      id: entry.id as string,
      name: (entry.full_name as string | null) ?? "Sans nom",
      company: (entry.company as string | null) ?? null,
    }));

  const leads: ConfiguratorPerson[] = (leadRows ?? []).map((entry) => ({
    id: entry.id as string,
    name: entry.name as string,
    company: (entry.company as string | null) ?? null,
  }));

  // ── LE DESTINATAIRE ACTUEL DOIT FIGURER DANS LA LISTE ──────────────────
  //
  // Les deux listes sont filtrées pour la CRÉATION : pas de client archivé,
  // pas de lead déjà converti, et cinquante leads au plus. Toutes ces
  // raisons sont bonnes pour un chiffrage neuf, aucune ne l'est pour un
  // chiffrage qui désigne déjà quelqu'un.
  //
  // Un <select> dont la valeur n'est dans aucune option s'affiche vide et
  // vaut «  ». Enregistrer aurait donc silencieusement détaché le chiffrage
  // de son destinataire — une donnée perdue parce qu'une liste était
  // tronquée. On va donc le rechercher nommément quand il manque.
  if (clientId && !clients.some((entry) => entry.id === clientId)) {
    const { data: client } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, company")
      .eq("id", clientId)
      .maybeSingle();
    if (client) {
      clients.unshift({
        id: client.id as string,
        name: (client.full_name as string | null) ?? "Sans nom",
        company: (client.company as string | null) ?? null,
      });
    }
  }

  if (leadId && !leads.some((entry) => entry.id === leadId)) {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, name, company")
      .eq("id", leadId)
      .maybeSingle();
    if (lead) {
      leads.unshift({
        id: lead.id as string,
        name: lead.name as string,
        company: (lead.company as string | null) ?? null,
      });
    }
  }

  const selection = row.selection as unknown as PricingSelection;
  const conditions = row.conditions as unknown as PricingConditions;

  return (
    <main className="px-6 py-10 max-w-7xl mx-auto w-full space-y-6">
      <div>
        <Link
          href={`/admin/pricing/${id}`}
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← {row.title as string}
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Modifier le chiffrage</h1>
        <p className="text-kov-steel text-sm mt-1">
          Paramètres « {catalog.settings.label} », ceux qui ont servi à le chiffrer. Aucun devis n&apos;a
          encore été généré : tout est modifiable.
        </p>
      </div>

      <PricingConfigurator
        catalog={catalog}
        settingsVersionId={row.settings_version_id as string}
        clients={clients}
        leads={leads}
        oldestBenchmarkConsultedAt={oldestBenchmark}
        todayIso={new Date().toISOString().slice(0, 10)}
        initial={{
          configurationId: id,
          title: row.title as string,
          recipient: clientId ? `client:${clientId}` : leadId ? `lead:${leadId}` : "",
          segment: (row.segment as string | null) ?? "",
          selection,
          conditions,
        }}
      />
    </main>
  );
}
