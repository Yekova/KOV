import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion — KOV",
  description: "Connexion à l'espace client ou admin KOV.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const nextParam = searchParams.next;
  const next = typeof nextParam === "string" ? nextParam : undefined;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-md">
        <p className="font-display text-kov-bone text-lg tracking-widest mb-8 text-center">KOV</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
