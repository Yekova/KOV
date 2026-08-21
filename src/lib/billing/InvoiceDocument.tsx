import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, formatEuros, formatDate } from "./pdfStyles";
import { BUSINESS_INFO } from "./businessInfo";
import { PdfFooter } from "./PdfFooter";
import { KOV_LOGO_SRC } from "./logoImage";

export interface InvoicePdfData {
  reference: string;
  issuedAt: string;
  dueAt: string | null;
  kind: "full" | "deposit" | "balance";
  depositPercent: number | null;
  totalProjectCents: number | null;
  amountCents: number;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  projectName: string | null;
}

const KIND_LABEL: Record<InvoicePdfData["kind"], string> = {
  full: "Facture",
  deposit: "Facture d'acompte",
  balance: "Facture de solde",
};

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <Image src={KOV_LOGO_SRC} style={pdfStyles.logo} />
          <View>
            <Text style={pdfStyles.docTitle}>{KIND_LABEL[data.kind].toUpperCase()}</Text>
            <Text style={pdfStyles.docMeta}>Référence {data.reference}</Text>
            <Text style={pdfStyles.docMeta}>Émise le {formatDate(data.issuedAt)}</Text>
          </View>
        </View>

        <View style={pdfStyles.partiesRow}>
          <View style={pdfStyles.partyBlock}>
            <Text style={pdfStyles.partyLabel}>Émetteur</Text>
            <Text style={pdfStyles.partyLine}>
              {BUSINESS_INFO.legalName} ({BUSINESS_INFO.commercialName})
            </Text>
            <Text style={pdfStyles.partyLine}>{BUSINESS_INFO.address.street}</Text>
            <Text style={pdfStyles.partyLine}>
              {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
            </Text>
            <Text style={pdfStyles.partyLine}>SIRET {BUSINESS_INFO.siret}</Text>
          </View>
          <View style={pdfStyles.partyBlock}>
            <Text style={pdfStyles.partyLabel}>Facturé à</Text>
            <Text style={pdfStyles.partyLine}>{data.clientName}</Text>
            {data.clientCompany && <Text style={pdfStyles.partyLine}>{data.clientCompany}</Text>}
            {data.clientEmail && <Text style={pdfStyles.partyLine}>{data.clientEmail}</Text>}
          </View>
        </View>

        {data.kind !== "full" && data.totalProjectCents != null && (
          <View style={pdfStyles.noteBox}>
            <Text>
              {data.kind === "deposit"
                ? `Acompte de ${data.depositPercent}% sur un montant total de projet de ${formatEuros(data.totalProjectCents)}.`
                : `Facture de solde — montant total du projet : ${formatEuros(data.totalProjectCents)}.`}
            </Text>
          </View>
        )}

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            <Text style={[pdfStyles.colDescription, pdfStyles.tableHeaderText]}>Description</Text>
            <Text style={[pdfStyles.colTotal, pdfStyles.tableHeaderText]}>Montant</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.colDescription}>{data.projectName ?? "Prestation KOV"}</Text>
            <Text style={pdfStyles.colTotal}>{formatEuros(data.amountCents)}</Text>
          </View>
        </View>

        <View style={pdfStyles.totalsBlock}>
          <View style={pdfStyles.totalsRowFinal}>
            <Text style={pdfStyles.totalsFinalLabel}>Total dû</Text>
            <Text style={pdfStyles.totalsFinalValue}>{formatEuros(data.amountCents)}</Text>
          </View>
        </View>

        <View style={pdfStyles.paymentBlock}>
          <Text style={pdfStyles.paymentLabel}>Paiement</Text>
          {data.dueAt && <Text style={pdfStyles.paymentLine}>Échéance : {formatDate(data.dueAt)}</Text>}
          <Text style={pdfStyles.paymentLine}>IBAN : {BUSINESS_INFO.iban}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
