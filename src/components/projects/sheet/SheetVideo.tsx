"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { ProjectSheetData } from "./sheetData";

// A real thumbnail, not a button that says "video".
//
// The poster stands until someone asks for the film: preload is metadata
// only and the <video> element is not even mounted until the thumbnail is
// clicked, so nothing of a multi-megabyte file is fetched by opening the
// sheet. Neither project carries a film today, so this renders for nobody
// — it is here for the moment one lands in projects.ts.
export function SheetVideo({ data }: { data: ProjectSheetData }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!data.video) return null;
  const { src, poster, width, height, duration } = data.video;

  return (
    <section className="ps-film" aria-label="Le film du projet">
      <p className="ps-label">Le film</p>

      <div className="ps-film__frame" style={{ aspectRatio: `${width} / ${height}` }}>
        {playing ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="ps-film__player"
          />
        ) : (
          <button type="button" className="ps-film__trigger" onClick={() => setPlaying(true)}>
            <Image src={poster} alt="" aria-hidden="true" fill sizes="(max-width: 1023px) 92vw, 62vw" className="ps-film__poster" />
            <span aria-hidden="true" className="ps-film__scrim" />
            <span aria-hidden="true" className="ps-film__play">
              <Play size={20} strokeWidth={2} fill="currentColor" />
            </span>
            <span className="ps-film__caption">
              Film du projet
              {duration && (
                <>
                  <span aria-hidden="true"> — </span>
                  {duration}
                </>
              )}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
