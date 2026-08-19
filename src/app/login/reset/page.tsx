import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — KOV",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-md">
        <p className="font-display text-kov-bone text-lg tracking-widest mb-8 text-center">KOV</p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
