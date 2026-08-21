"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { updateMyProfile } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export function ProfileForm({ fullName, company }: { fullName: string | null; company: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyProfile(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <label className="block text-xs text-kov-steel">
        Nom
        <input name="full_name" defaultValue={fullName ?? ""} required className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
      </label>
      <label className="block text-xs text-kov-steel">
        Entreprise
        <input name="company" defaultValue={company ?? ""} className={`${FIELD_CLASS} mt-1`} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }} />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {error && <p className="text-kov-red text-sm">{error}</p>}
        {saved && !error && <p className="text-kov-steel text-sm">Enregistré ✓</p>}
      </div>
    </form>
  );
}
