"use client";

import "./ActivationBackdrop.css";

interface ActivationBackdropProps {
  reducedMotion: boolean;
}

// The window's own background, in four layers from back to front:
//
//   1. the graphite base,
//   2. three slowly drifting colour blobs,
//   3. the two dark circular voids that make the card's top and bottom read
//      as arcs curving out of the page — kept above the colour so they stay
//      genuinely dark rather than tinted,
//   4. a scrim weighted toward the left, where the copy sits.
//
// This replaces a version that put `filter: invert(1)` over the whole stack.
// Inverting turned the graphite base (#181d20) into #e7e2df — near-white,
// while the text over it is --kov-bone (#e7e7e5). That is a contrast ratio of
// roughly 1:1, which is why the section couldn't be read at all.
export function ActivationBackdrop({ reducedMotion }: ActivationBackdropProps) {
  const still = reducedMotion ? " kov-blob--still" : "";

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
        style={{ background: "var(--kov-graphite)" }}
      >
        <div className={`kov-blob kov-blob--red${still}`} />
        <div className={`kov-blob kov-blob--signal${still}`} />
        <div className={`kov-blob kov-blob--cool${still}`} />

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle 640px at 50% -6%, rgba(8,8,9,0.95), transparent 46%), radial-gradient(circle 640px at 50% 106%, rgba(8,8,9,0.95), transparent 46%)",
          }}
        />

        {/* The copy column occupies the left 30% of the card. Rather than
            dulling the whole field to make it readable, the weight is put
            where the words actually are and the right side keeps its colour
            for the coverflow to sit in. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(8,8,9,0.78) 0%, rgba(8,8,9,0.55) 26%, rgba(8,8,9,0.2) 46%, transparent 62%)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }}
      />
    </>
  );
}
