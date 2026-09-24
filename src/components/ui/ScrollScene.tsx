"use client";

import { useEffect, useRef } from "react";
import { gsap, initGsap, motion, stagger, GSAP_LIQUID_EASE, scrollScenesEnabled } from "@/lib/motion";

// Desktop-only scroll choreography, wrapped around content that stays a
// Server Component.
//
// Three of the homepage's sections are Server Components and one of them
// (WorkGallery) had no motion at all. Turning them into Client Components to
// animate them would drag their whole subtree across the boundary for the
// sake of a tween. Children passed through a client wrapper stay server
// rendered, so this costs one small client component and nothing else.
//
// Nothing here runs unless scrollScenesEnabled() says so, which means
// desktop, and means a viewport that has not asked for reduced motion. On
// every other viewport the content renders exactly as the server sent it:
// visible, in place, untouched. That is the site's established rule for
// scrubbed scenes and it is why the "from" state is only ever set inside the
// effect, never in the markup. Content that would be invisible without
// JavaScript is content that is invisible when JavaScript fails.
export function ScrollScene({
  children,
  className,
  /** Children rise into place in sequence as the block enters. */
  stagger: staggered = false,
  /** Gentle scrubbed drift in px across the viewport crossing. This is the
   *  part that reads as motion *while* scrolling rather than motion *on
   *  arrival*, which is the difference between a page that responds and a
   *  page that merely appears. */
  parallax = 0,
  /** Which descendants stagger. Defaults to the direct children. */
  selector,
  spacing = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  parallax?: number;
  selector?: string;
  spacing?: keyof typeof stagger;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollScenesEnabled()) return;
    const el = ref.current;
    if (!el) return;
    initGsap();

    const ctx = gsap.context(() => {
      if (staggered) {
        const targets = selector ? el.querySelectorAll(selector) : Array.from(el.children);
        if (targets.length) {
          gsap.fromTo(
            targets,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: motion.normal,
              ease: GSAP_LIQUID_EASE,
              stagger: stagger[spacing],
              scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" },
            }
          );
        }
      }

      if (parallax) {
        // On the inner element this component renders itself, never on `el`
        // and never on whatever the caller passed as its first child.
        //
        // Two separate reasons, both learned here the hard way. A transform
        // makes its element the containing block for fixed descendants and
        // the scroll container for sticky ones, so a parallax on a section
        // wrapper silently un-sticks anything sticky inside it. And GSAP
        // composes one transform per element: animating the y of an element
        // that Reveal is also transforming means the last writer wins and
        // the other effect vanishes without an error.
        //
        // Owning the element removes both. It is ours, nothing else writes
        // to it, and it sits between the trigger and the caller's content.
        const inner = el.querySelector<HTMLElement>(":scope > [data-scroll-parallax]");
        if (inner) {
          gsap.fromTo(
            inner,
            { y: parallax },
            {
              y: -parallax,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        }
      }
    }, el);

    return () => ctx.revert();
  }, [staggered, parallax, selector, spacing]);

  // The extra element exists only when a parallax needs somewhere safe to
  // land. Without one, this renders a single wrapper and adds no depth to
  // the tree, which matters because `stagger` counts direct children.
  return (
    <div ref={ref} className={className}>
      {parallax ? <div data-scroll-parallax>{children}</div> : children}
    </div>
  );
}
