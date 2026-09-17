import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — KOV",
  // A password flow has nothing to offer a search result, and a reset page
  // reachable from Google is a page reachable by someone who did not ask for
  // it. /login already answers noindex; these two were missed.
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-md">
        <p className="font-display text-kov-bone text-lg tracking-widest mb-8 text-center">KOV</p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
