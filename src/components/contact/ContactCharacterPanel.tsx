"use client";

import { useRef, useState } from "react";
import { ScrubVideo, type ScrubVideoHandle } from "@/components/ui/ScrubVideo";

const MARKERS = [0, 0.25, 0.5, 0.75, 1];

export function ContactCharacterPanel() {
  const scrubRef = useRef<ScrubVideoHandle>(null);
  const [progress, setProgress] = useState(0);

  const degrees = Math.round(progress * 360 - 180);
  const activeMarkerIndex = MARKERS.reduce(
    (closest, marker, index) => (Math.abs(marker - progress) < Math.abs(MARKERS[closest] - progress) ? index : closest),
    0
  );

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-2 pt-1">
        {MARKERS.map((marker, index) => (
          <button
            key={marker}
            type="button"
            onClick={() => scrubRef.current?.seekTo(marker)}
            aria-label={`Repère ${index + 1}`}
            className="w-8 h-8 flex items-center justify-center text-[11px] uppercase tracking-widest border transition-colors"
            style={{
              borderRadius: "var(--radius-pill)",
              borderColor: index === activeMarkerIndex ? "var(--kov-red)" : "var(--kov-border)",
              background: index === activeMarkerIndex ? "var(--kov-red)" : "transparent",
              color: index === activeMarkerIndex ? "var(--kov-white)" : "var(--kov-steel)",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <ScrubVideo
          ref={scrubRef}
          src="/kov/character/contact-corridor-scrub.mp4"
          poster="/kov/character/contact-corridor-still.png"
          aspectRatio="3 / 4"
          onProgressChange={setProgress}
          className="w-full"
        />

        <div className="relative mt-4 h-px" style={{ background: "var(--kov-border)" }}>
          <span
            className="absolute top-1/2 w-2 h-2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${progress * 100}%`, background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-kov-steel">
          <span>-180°</span>
          <span>0°</span>
          <span>+180°</span>
        </div>
        <p className="text-xs text-kov-steel mt-3 uppercase tracking-widest">
          Faites glisser pour explorer <span className="text-kov-bone">{degrees}°</span>
        </p>
      </div>
    </div>
  );
}
