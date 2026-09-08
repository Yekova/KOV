import { ActivationWindow } from "@/components/home/ActivationWindow";

// No standalone title here anymore — "Un site qui vous ressemble" now
// lives inside ActivationWindow's own activated-state left column
// (alongside the coverflow it introduces), not as a separate heading
// sitting above the window. The idle (pre-activation) moment shows only
// "Activez votre site en un geste." + the slider; the section only
// introduces itself by name once activated.
export function ImmersiveShowcase() {
  return (
    <section id="showcase-immersive" className="px-6 py-32 max-w-[1600px] mx-auto">
      <ActivationWindow />
    </section>
  );
}
