import { ScrollFloat } from "@/components/ui/ScrollFloat";
import { ActivationWindow } from "@/components/home/ActivationWindow";

// Title stays a plain server-rendered wrapper — all the actual interaction
// lives in ActivationWindow, a client component. No scroll-pin/zoom
// mechanic here anymore: the previous "dive in" version scaled a card to
// fill the viewport on scroll, but this section's whole interaction model
// changed to something that plays out inside one static window instead
// (see ActivationWindow.tsx) — the window doesn't need to grow to
// fullscreen to feel immersive anymore, the drag-to-activate sequence
// carries that on its own.
export function ImmersiveShowcase() {
  return (
    <section id="showcase-immersive" className="px-6 py-32 max-w-[1600px] mx-auto">
      <ScrollFloat
        containerClassName="text-center mb-24 md:mb-36"
        textClassName="font-display text-kov-bone uppercase text-[clamp(28px,4vw,64px)] leading-[var(--line-height-display)]"
        stagger={0.02}
      >
        Un site qui vous ressemble
      </ScrollFloat>

      <div className="flex justify-center">
        <ActivationWindow />
      </div>
    </section>
  );
}
