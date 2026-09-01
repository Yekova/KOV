import { QueryProvider } from "./QueryProvider";

// Scoped to /admin/content only — this is the one section of the admin
// using TanStack Query + Sonner toasts (an explicit, deliberate choice for
// this feature; every other admin section still uses plain Server Actions
// + useTransition + inline error text, no query-cache library or toast
// system involved).
export default function ContentLayout({ children }: LayoutProps<"/admin/content">) {
  return <QueryProvider>{children}</QueryProvider>;
}
