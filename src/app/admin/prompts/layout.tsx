import { QueryProvider } from "@/app/admin/content/QueryProvider";

// Réutilise le provider de /admin/content, comme le fait déjà
// /admin/realisations : même QueryClient, et surtout le même <Toaster/>,
// monté à un seul endroit de l'application alors que seize fichiers
// appellent toast(). Une section qui veut des toasts doit en apporter un.
export default function PromptsLayout({ children }: LayoutProps<"/admin/prompts">) {
  return <QueryProvider>{children}</QueryProvider>;
}
