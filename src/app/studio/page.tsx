import type { Metadata } from "next";
import { StudioExperience } from "@/components/studio/StudioExperience";

export const metadata: Metadata = {
  title: "Studio — KOV",
  description: "Visitez le studio KOV en 360° — une exploration immersive de notre espace.",
  alternates: { canonical: "https://kov-agency.site/studio" },
};

export default function StudioPage() {
  return (
    <main className="fixed inset-0 h-dvh w-dvw overflow-hidden">
      <StudioExperience />
    </main>
  );
}
