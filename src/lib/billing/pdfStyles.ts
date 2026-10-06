import { StyleSheet } from "@react-pdf/renderer";

// KOV red, kept for the one accent line/heading — everything else on a
// generated PDF is black/grey on white, unlike the site's dark theme:
// heavy dark backgrounds don't reproduce reliably across PDF viewers/print.
export const RED = "#E31E24";
export const INK = "#0A0A0A";
export const STEEL = "#6B6B68";
export const BORDER = "#DDDBD6";

// ── LA PLACE RÉSERVÉE AU PIED DE PAGE ────────────────────────────────────
//
// Le pied est `position: absolute` et `fixed` : il se répète sur chaque
// page, et il est HORS DU FLUX. Le contenu ne le voit donc pas, et
// descendait jusqu'à `paddingBottom`, c'est-à-dire par-dessus lui — d'où
// le bloc « Inclus » imprimé sur les mentions légales.
//
// La correction n'est pas de déplacer le pied : c'est de réserver sa
// hauteur dans la marge basse de la page. Et on la CALCULE, pour qu'elle
// ne puisse pas se désynchroniser du style qu'elle doit couvrir.
//
// Mesuré sur les métriques Helvetica livrées avec react-pdf, à 7 pt sur
// une largeur utile de 515 pt : les trois lignes actuelles occupent
// 72,5 pt depuis le bas, pour 40 pt réservés.
//
// On réserve CINQ lignes et non trois, parce que la mention de retard de
// paiement vient de business_settings et s'édite depuis /admin/settings :
// elle remplit aujourd'hui 99 % de sa ligne, soit deux caractères avant
// d'en prendre une seconde. Une réserve ajustée au contenu du jour se
// rouvrirait au premier mot ajouté, dans un PDF déjà parti chez un client.
const FOOTER_BOTTOM = 30;
const FOOTER_FONT_SIZE = 7;
const FOOTER_LINE_HEIGHT = 1.5;
const FOOTER_PADDING_TOP = 10;
const FOOTER_BORDER = 1;
const FOOTER_MAX_LINES = 5;

const FOOTER_RESERVE = Math.ceil(
  FOOTER_BOTTOM +
    FOOTER_MAX_LINES * FOOTER_FONT_SIZE * FOOTER_LINE_HEIGHT +
    FOOTER_PADDING_TOP +
    FOOTER_BORDER
);

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingLeft: 40,
    paddingRight: 40,
    // Pas `padding: 40` suivi d'un remplacement : l'ordre de résolution
    // d'un raccourci n'a pas à être une chose dont ce fichier dépend.
    paddingBottom: FOOTER_RESERVE,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: INK,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  logo: {
    width: 90,
    height: 17,
  },
  docTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docMeta: {
    fontSize: 9,
    color: STEEL,
    textAlign: "right",
    marginTop: 4,
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  partyBlock: {
    width: "48%",
  },
  partyLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: STEEL,
    marginBottom: 6,
  },
  partyLine: {
    fontSize: 10,
    marginBottom: 2,
  },
  noteBox: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 20,
    fontSize: 9,
    color: STEEL,
  },
  table: {
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 8,
  },
  colDescription: { width: "52%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnitPrice: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  tableHeaderText: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: STEEL,
  },
  totalsBlock: {
    alignSelf: "flex-end",
    width: "45%",
    marginBottom: 28,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: INK,
  },
  totalsLabel: {
    fontSize: 10,
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: RED,
  },
  paymentBlock: {
    marginBottom: 28,
  },
  paymentLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: STEEL,
    marginBottom: 6,
  },
  paymentLine: {
    fontSize: 9,
    marginBottom: 2,
  },
  // Les valeurs viennent des constantes du haut : c'est ce qui garantit que
  // la place réservée dans `page` couvre bien ce qui est dessiné ici.
  footer: {
    position: "absolute",
    bottom: FOOTER_BOTTOM,
    left: 40,
    right: 40,
    borderTopWidth: FOOTER_BORDER,
    borderTopColor: BORDER,
    paddingTop: FOOTER_PADDING_TOP,
  },
  footerText: {
    fontSize: FOOTER_FONT_SIZE,
    color: STEEL,
    lineHeight: FOOTER_LINE_HEIGHT,
  },
});

// Not toLocaleString("fr-FR", ...) — that inserts a narrow no-break space
// (U+202F) as the thousands separator, which the PDFs' standard Helvetica
// font has no glyph for, rendering as a stray bar/slash instead of a space
// (react-pdf can only use PDF base-14 fonts here; embedding a custom font
// with a fuller charset would be the fix if this space were load-bearing).
// A plain ASCII space renders identically in HTML emails and sidesteps the
// PDF issue entirely, so it's used everywhere this helper is called.
export function formatEuros(cents: number) {
  const [integerPart, decimalPart] = (Math.abs(cents) / 100).toFixed(2).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${cents < 0 ? "-" : ""}${grouped},${decimalPart} €`;
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
