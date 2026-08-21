import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, formatEuros, formatDate } from "./pdfStyles";
import type { BusinessInfo } from "./businessInfo";
import type { LineItem } from "./quoteLineItems";
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
  lineItems: LineItem[];
}

const KIND_LABEL: Record<InvoicePdfData["kind"], string> = {
  full: "Facture",
  deposit: "Facture d'acompte",
  balance: "Facture de solde",
};

export function InvoiceDocument({ data, businessInfo }: { data: InvoicePdfData; businessInfo: BusinessInfo }) {
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
              {businessInfo.legalName} ({businessInfo.commercialName})
            </Text>
            <Text style={pdfStyles.partyLine}>{businessInfo.address.street}</Text>
            <Text style={pdfStyles.partyLine}>
              {businessInfo.address.postalCode} {businessInfo.address.city}
            </Text>
            <Text style={pdfStyles.partyLine}>SIRET {businessInfo.siret}</Text>
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

        {data.lineItems.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <Text style={[pdfStyles.colDescription, pdfStyles.tableHeaderText]}>Description</Text>
              <Text style={[pdfStyles.colQty, pdfStyles.tableHeaderText]}>Qté</Text>
              <Text style={[pdfStyles.colUnitPrice, pdfStyles.tableHeaderText]}>Prix unitaire</Text>
              <Text style={[pdfStyles.colTotal, pdfStyles.tableHeaderText]}>Total</Text>
            </View>
            {data.lineItems.map((item, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={pdfStyles.colDescription}>{item.description}</Text>
                <Text style={pdfStyles.colQty}>{item.quantity}</Text>
                <Text style={pdfStyles.colUnitPrice}>{formatEuros(item.unitPriceCents)}</Text>
                <Text style={pdfStyles.colTotal}>{formatEuros(item.quantity * item.unitPriceCents)}</Text>
              </View>
            ))}
          </View>
        ) : (
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
        )}

        <View style={pdfStyles.totalsBlock}>
          <View style={pdfStyles.totalsRowFinal}>
            <Text style={pdfStyles.totalsFinalLabel}>Total dû</Text>
            <Text style={pdfStyles.totalsFinalValue}>{formatEuros(data.amountCents)}</Text>
          </View>
        </View>

        <View style={pdfStyles.paymentBlock}>
          <Text style={pdfStyles.paymentLabel}>Paiement</Text>
          {data.dueAt && <Text style={pdfStyles.paymentLine}>Échéance : {formatDate(data.dueAt)}</Text>}
          <Text style={pdfStyles.paymentLine}>IBAN : {businessInfo.iban}</Text>
        </View>

        <PdfFooter businessInfo={businessInfo} />
      </Page>
    </Document>
  );
}
