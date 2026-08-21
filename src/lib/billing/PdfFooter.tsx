import { View, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfStyles";
import type { BusinessInfo } from "./businessInfo";

export function PdfFooter({ businessInfo }: { businessInfo: BusinessInfo }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>
        {businessInfo.legalName} — {businessInfo.legalForm} — {businessInfo.address.street},{" "}
        {businessInfo.address.postalCode} {businessInfo.address.city}
        {"\n"}
        SIRET {businessInfo.siret} — APE {businessInfo.apeCode} — {businessInfo.vatMention}
        {"\n"}
        {businessInfo.latePaymentMention}
      </Text>
    </View>
  );
}
