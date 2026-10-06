// Vérifier que la marge basse réservée au pied de page est bien la limite
// du flux de contenu.
//
// Le pied est `position: absolute` + `fixed` : il est hors du flux, donc
// rien ne l'empêche d'être recouvert. La seule chose qui le protège est la
// marge basse de la page — à condition que react-pdf casse bien ses pages
// dessus, et c'est CETTE hypothèse qu'il faut vérifier, pas l'arithmétique
// qui en découle.
//
// Méthode : rendre deux fois le même contenu, avec l'ancienne réserve puis
// avec la nouvelle. Si la marge basse est la limite du flux, la réserve
// plus grande fait tenir moins de lignes par page — donc plus de pages.
// Si le nombre de pages ne bouge pas, c'est qu'elle n'est pas respectée et
// que la correction ne tient pas.
//
// Rendu avec createElement plutôt qu'en JSX : ce fichier doit tourner sous
// `node` sans étape de compilation.

import { createElement as h } from "react";
import { renderToBuffer, Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles } from "../src/lib/billing/pdfStyles.ts";

const FOOTER_TEXT =
  "Mattéo Delorme — Entreprise individuelle — 49 rue André Maginot, 33200 Bordeaux\n" +
  "SIRET 941 801 391 00017 — APE 62.01Z — TVA non applicable, art. 293 B du CGI\n" +
  "En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera appliquée, " +
  "ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €.";

const LINES = 200;

async function pageCount(paddingBottom) {
  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: { ...pdfStyles.page, paddingBottom } },
      ...Array.from({ length: LINES }, (_, i) =>
        h(Text, { key: i, style: { marginBottom: 4 } }, `Ligne de contenu ${i + 1}.`)
      ),
      h(View, { style: pdfStyles.footer, fixed: true }, h(Text, { style: pdfStyles.footerText }, FOOTER_TEXT))
    )
  );
  const buffer = await renderToBuffer(doc);
  // Le catalogue des pages porte /Count ; à défaut, on compte les objets
  // /Type /Page qui ne sont pas /Pages.
  const text = buffer.toString("latin1");
  const count = text.match(/\/Count\s+(\d+)/);
  if (count) return Number(count[1]);
  return (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

const RESERVE = pdfStyles.page.paddingBottom;
const OLD = 40;

const [withOld, withNew] = await Promise.all([pageCount(OLD), pageCount(RESERVE)]);

console.log(`Contenu identique : ${LINES} lignes\n`);
console.log(`  marge basse ${String(OLD).padStart(3)} pt (avant) -> ${withOld} pages`);
console.log(`  marge basse ${String(RESERVE).padStart(3)} pt (apres) -> ${withNew} pages\n`);

// Le pied mesure 72,5 pt de haut (3 lignes de 7 pt a 1,5 d'interligne,
// + 10 de padding, + 1 de filet, + 30 d'offset bas). Mesure faite sur les
// metriques Helvetica livrees avec react-pdf.
const FOOTER_TOP = 72.5;

const honoured = withNew > withOld;
const covers = RESERVE >= FOOTER_TOP;

console.log(`La marge basse est la limite du flux .... ${honoured ? "OUI" : "NON"}`);
console.log(`La reserve couvre le pied (>= 72,5 pt) .. ${covers ? `OUI (${RESERVE} pt)` : `NON (${RESERVE} pt)`}`);
console.log(`Marge de securite ....................... ${(RESERVE - FOOTER_TOP).toFixed(1)} pt`);

if (!honoured) {
  console.log("\nECHEC : agrandir la marge basse ne change rien au decoupage.");
  console.log("Le contenu ne s'arrete donc pas dessus, et le pied peut encore etre recouvert.");
}
process.exit(honoured && covers ? 0 : 1);
