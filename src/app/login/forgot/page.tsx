import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — KOV",
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
