import { QueryProvider } from "@/app/admin/content/QueryProvider";

// Reuses /admin/content's provider rather than standing up a second one:
// it is the same QueryClient shape and, more to the point, the same
// <Toaster/> — which is mounted in exactly one place in this app even
// though sixteen files call toast(). A section that wants toasts has to
// bring one with it.
export default function RealisationsLayout({ children }: LayoutProps<"/admin/realisations">) {
  return <QueryProvider>{children}</QueryProvider>;
}
