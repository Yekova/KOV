import type { Metadata } from "next";
import { StudioExperience } from "@/components/studio/StudioExperience";

export const metadata: Metadata = {
  title: "Studio virtuel 360° — visitez nos espaces | KOV Bordeaux",
  description:
    "Visitez le studio KOV en 360° : des salles à parcourir, une navigation WebGL et un plan interactif. La démonstration de ce qu'on sait construire.",
  alternates: { canonical: "https://kov-agency.site/studio" },
};

export default function StudioPage() {
  return (
    <main className="fixed inset-0 h-dvh w-dvw overflow-hidden">
      <StudioExperience />
    </main>
  );
}
