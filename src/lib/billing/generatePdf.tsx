import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument, type InvoicePdfData } from "./InvoiceDocument";
import { QuoteDocument, type QuotePdfData } from "./QuoteDocument";
import { getBusinessInfo } from "./businessInfo";

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  const businessInfo = await getBusinessInfo();
  return renderToBuffer(<InvoiceDocument data={data} businessInfo={businessInfo} />);
}

export async function generateQuotePdfBuffer(data: QuotePdfData): Promise<Buffer> {
  const businessInfo = await getBusinessInfo();
  return renderToBuffer(<QuoteDocument data={data} businessInfo={businessInfo} />);
}
