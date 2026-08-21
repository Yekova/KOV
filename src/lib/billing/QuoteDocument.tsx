import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, formatEuros, formatDate } from "./pdfStyles";
import { BUSINESS_INFO } from "./businessInfo";
import { PdfFooter } from "./PdfFooter";
import { KOV_LOGO_SRC } from "./logoImage";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface QuotePdfData {
  reference: string;
  createdAt: string;
  validUntil: string | null;
  recipientName: string;
  recipientEmail: string | null;
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          <Image src={KOV_LOGO_SRC} style={pdfStyles.logo} />
          <View>
            <Text style={pdfStyles.docTitle}>DEVIS</Text>
            <Text style={pdfStyles.docMeta}>Référence {data.reference}</Text>
            <Text style={pdfStyles.docMeta}>Établi le {formatDate(data.createdAt)}</Text>
            {data.validUntil && <Text style={pdfStyles.docMeta}>Valable jusqu&apos;au {formatDate(data.validUntil)}</Text>}
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
            <Text style={pdfStyles.partyLabel}>Destinataire</Text>
            <Text style={pdfStyles.partyLine}>{data.recipientName}</Text>
            {data.recipientEmail && <Text style={pdfStyles.partyLine}>{data.recipientEmail}</Text>}
          </View>
        </View>

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

        <View style={pdfStyles.totalsBlock}>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Sous-total</Text>
            <Text style={pdfStyles.totalsValue}>{formatEuros(data.subtotalCents)}</Text>
          </View>
          {data.discountCents > 0 && (
            <View style={pdfStyles.totalsRow}>
              <Text style={pdfStyles.totalsLabel}>Remise</Text>
              <Text style={pdfStyles.totalsValue}>−{formatEuros(data.discountCents)}</Text>
            </View>
          )}
          <View style={pdfStyles.totalsRowFinal}>
            <Text style={pdfStyles.totalsFinalLabel}>Total</Text>
            <Text style={pdfStyles.totalsFinalValue}>{formatEuros(data.totalCents)}</Text>
          </View>
        </View>

        <View style={pdfStyles.noteBox}>
          <Text>
            {BUSINESS_INFO.vatMention}. Devis valable {data.validUntil ? `jusqu'au ${formatDate(data.validUntil)}` : "30 jours"}
            . Bon pour accord — merci de retourner ce devis signé pour valider le lancement de la prestation.
          </Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
