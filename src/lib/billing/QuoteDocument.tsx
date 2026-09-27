import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { pdfStyles, formatEuros, formatDate } from "./pdfStyles";
import type { BusinessInfo } from "./businessInfo";
import { PdfFooter } from "./PdfFooter";
import { KOV_LOGO_SRC } from "./logoImage";
import type { QuotePdfPricing, QuoteRecipientAddress } from "@/lib/pricing/quotePayload";

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

  // ── Ce qui a été ajouté pour le module de pricing ──────────────────────
  //
  // Tout est optionnel, et l'absence rend EXACTEMENT le PDF d'avant. Un
  // devis rédigé à la main dans /admin/quotes passe donc par le même
  // composant sans rien changer à sa sortie.
  //
  // L'adresse et le SIREN du destinataire sont au premier niveau, pas dans
  // le bloc pricing : la spec demande de compléter les mentions manquantes
  // du générateur existant, pas d'en produire deux versions selon l'origine
  // du devis. Un devis sans identité de destinataire n'est pas conforme,
  // qu'il vienne d'un chiffrage ou d'une saisie.
  recipientAddress?: QuoteRecipientAddress | null;
  recipientSiren?: string | null;
  recipientVatNumber?: string | null;
  pricing?: QuotePdfPricing | null;
}

function TextBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={pdfStyles.paymentBlock}>
      <Text style={pdfStyles.paymentLabel}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={pdfStyles.paymentLine}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export function QuoteDocument({ data, businessInfo }: { data: QuotePdfData; businessInfo: BusinessInfo }) {
  const pricing = data.pricing ?? null;
  const address = data.recipientAddress ?? null;
  const hasAddress = Boolean(address?.street || address?.city);
  const hasVat = (pricing?.vatRateBp ?? 0) > 0;

  // Qui décide de la mention : la version tarifaire quand le devis vient
  // d'un chiffrage, business_settings sinon. Et rien du tout quand une TVA
  // réelle s'applique — imprimer « TVA non applicable » sous une ligne de
  // TVA serait se contredire sur le même document.
  const vatSentence = pricing
    ? pricing.vatExemptionMention
      ? `${pricing.vatExemptionMention}. `
      : ""
    : `${businessInfo.vatMention}. `;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's
              Image is a PDF drawing primitive and has no alt prop; the rule
              matches on the component name and assumes next/image or <img>.
              A PDF has no accessibility tree for an alt to land in. */}
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
              {businessInfo.legalName} ({businessInfo.commercialName})
            </Text>
            <Text style={pdfStyles.partyLine}>{businessInfo.address.street}</Text>
            <Text style={pdfStyles.partyLine}>
              {businessInfo.address.postalCode} {businessInfo.address.city}
            </Text>
            <Text style={pdfStyles.partyLine}>SIRET {businessInfo.siret}</Text>
          </View>
          <View style={pdfStyles.partyBlock}>
            <Text style={pdfStyles.partyLabel}>Destinataire</Text>
            <Text style={pdfStyles.partyLine}>{data.recipientName}</Text>
            {hasAddress && address?.street && <Text style={pdfStyles.partyLine}>{address.street}</Text>}
            {hasAddress && (address?.postalCode || address?.city) && (
              <Text style={pdfStyles.partyLine}>
                {[address?.postalCode, address?.city].filter(Boolean).join(" ")}
              </Text>
            )}
            {address?.country && <Text style={pdfStyles.partyLine}>{address.country}</Text>}
            {data.recipientEmail && <Text style={pdfStyles.partyLine}>{data.recipientEmail}</Text>}
            {data.recipientSiren && <Text style={pdfStyles.partyLine}>SIREN {data.recipientSiren}</Text>}
            {data.recipientVatNumber && <Text style={pdfStyles.partyLine}>TVA {data.recipientVatNumber}</Text>}
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
          {/* Sans TVA applicable, le bloc reste celui d'avant : une seule
              ligne « Total ». Ajouter « Total HT » puis « Total TTC » à
              l'identique ferait lire deux fois le même nombre. */}
          {hasVat && pricing ? (
            <>
              <View style={pdfStyles.totalsRow}>
                <Text style={pdfStyles.totalsLabel}>Total HT</Text>
                <Text style={pdfStyles.totalsValue}>{formatEuros(data.totalCents)}</Text>
              </View>
              <View style={pdfStyles.totalsRow}>
                <Text style={pdfStyles.totalsLabel}>
                  TVA {(pricing.vatRateBp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                </Text>
                <Text style={pdfStyles.totalsValue}>{formatEuros(pricing.vatAmountCents)}</Text>
              </View>
              <View style={pdfStyles.totalsRowFinal}>
                <Text style={pdfStyles.totalsFinalLabel}>Total TTC</Text>
                <Text style={pdfStyles.totalsFinalValue}>{formatEuros(pricing.totalInclVatCents)}</Text>
              </View>
            </>
          ) : (
            <View style={pdfStyles.totalsRowFinal}>
              <Text style={pdfStyles.totalsFinalLabel}>Total</Text>
              <Text style={pdfStyles.totalsFinalValue}>{formatEuros(data.totalCents)}</Text>
            </View>
          )}
        </View>

        {/* Les options : une section distincte, jamais additionnée. Le
            libellé le dit, parce qu'une colonne de prix sous un total
            invite à les additionner de tête. */}
        {pricing && pricing.options.length > 0 && (
          <View style={pdfStyles.paymentBlock}>
            <Text style={pdfStyles.paymentLabel}>Options proposées, non incluses dans le total</Text>
            {pricing.options.map((option, index) => (
              <Text key={index} style={pdfStyles.paymentLine}>
                {option.description} : {formatEuros(option.quantity * option.unitPriceCents)}
                {option.quantity > 1 && ` (${option.quantity} × ${formatEuros(option.unitPriceCents)})`}
              </Text>
            ))}
          </View>
        )}

        {pricing && pricing.schedule.length > 0 && (
          <View style={pdfStyles.paymentBlock}>
            <Text style={pdfStyles.paymentLabel}>Échéances de paiement</Text>
            {pricing.schedule.map((entry, index) => (
              <Text key={index} style={pdfStyles.paymentLine}>
                {entry.label} : {formatEuros(entry.amountCents)}
              </Text>
            ))}
            <Text style={pdfStyles.paymentLine}>
              Règlement à {businessInfo.paymentTermsDays} jours par virement sur {businessInfo.iban}.
            </Text>
          </View>
        )}

        {pricing?.leadTimeLabel && (
          <View style={pdfStyles.paymentBlock}>
            <Text style={pdfStyles.paymentLabel}>Délai d&apos;exécution</Text>
            <Text style={pdfStyles.paymentLine}>{pricing.leadTimeLabel} à compter de la commande.</Text>
          </View>
        )}

        {pricing && <TextBlock title="Inclus" items={pricing.included} />}
        {pricing && <TextBlock title="Non inclus" items={pricing.excluded} />}
        {pricing && <TextBlock title="Hypothèses" items={pricing.assumptions} />}

        <View style={pdfStyles.noteBox}>
          <Text>
            {vatSentence}
            Devis valable {data.validUntil ? `jusqu'au ${formatDate(data.validUntil)}` : "30 jours"}
            . Bon pour accord — merci de retourner ce devis signé pour valider le lancement de la prestation.
          </Text>
        </View>

        <PdfFooter businessInfo={businessInfo} />
      </Page>
    </Document>
  );
}
