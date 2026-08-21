import { StyleSheet } from "@react-pdf/renderer";

// KOV red, kept for the one accent line/heading — everything else on a
// generated PDF is black/grey on white, unlike the site's dark theme:
// heavy dark backgrounds don't reproduce reliably across PDF viewers/print.
export const RED = "#E31E24";
export const INK = "#0A0A0A";
export const STEEL = "#6B6B68";
export const BORDER = "#DDDBD6";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
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
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: STEEL,
    lineHeight: 1.5,
  },
});

export function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
