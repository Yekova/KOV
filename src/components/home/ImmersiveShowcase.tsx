import { ActivationWindow } from "@/components/home/ActivationWindow";

// "Un site qui vous ressemble" lives inside ActivationWindow's own left
// column (alongside the coverflow it introduces) — this wrapper just
// gives it a section landmark + the page's standard horizontal padding.
export function ImmersiveShowcase() {
  return (
    <section id="showcase-immersive" className="px-6 py-32 max-w-[1600px] mx-auto">
      <ActivationWindow />
    </section>
  );
}
