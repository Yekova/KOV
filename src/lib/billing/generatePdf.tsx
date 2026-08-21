import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument, type InvoicePdfData } from "./InvoiceDocument";
import { QuoteDocument, type QuotePdfData } from "./QuoteDocument";

export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}

export async function generateQuotePdfBuffer(data: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(<QuoteDocument data={data} />);
}
