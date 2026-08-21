import { View, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfStyles";
import { BUSINESS_INFO } from "./businessInfo";

export function PdfFooter() {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>
        {BUSINESS_INFO.legalName} — {BUSINESS_INFO.legalForm} — {BUSINESS_INFO.address.street},{" "}
        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
        {"\n"}
        SIRET {BUSINESS_INFO.siret} — APE {BUSINESS_INFO.apeCode} — {BUSINESS_INFO.vatMention}
        {"\n"}
        {BUSINESS_INFO.latePaymentMention}
      </Text>
    </View>
  );
}
