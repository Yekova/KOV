import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROJECTS } from "@/data/projects";

// The one real named client project (projects.ts) — the other three
// entries there are honest "à venir" placeholders, not usable here. No
// dedicated Kanti photo exists in the codebase yet (WorkGallery itself was
// gutted back to a placeholder), so this reuses real KOV studio
// photography rather than fabricating a product screenshot — the name,
// category and destination are all real; only the backdrop is generic.
const KANTI = PROJECTS[0];

export function ProjectSpotlightContent() {
  return (
    <Link href="/#work-gallery" className="group relative block h-full w-full overflow-hidden" style={{ borderRadius: 20 }}>
      <Image
        src="/kov/menu/atrium-brutaliste.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 30vw, 60vw"
        className="object-cover transition-[transform,filter] duration-500 group-hover:scale-[1.02] group-hover:contrast-110"
      />
      {/* Progressive gradient only — the image is meant to breathe, not
          sit behind an opaque content block (spec §10). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 78%)" }}
      />
      {/* Thin red line, invisible at rest — a targeted accent rather than a
          permanent red border (spec §06/§11). */}
      <div
        aria-hidden="true"
        className="absolute left-5 top-5 bottom-5 w-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: "linear-gradient(to bottom, transparent, var(--kov-red), transparent)" }}
      />

      <div className="relative h-full w-full flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
            Projet featured
          </p>
          <span className="text-kov-steel text-[10px] tabular-nums opacity-60 group-hover:opacity-100 transition-opacity">01 / 07</span>
        </div>

        <div>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">{KANTI.category}</p>
          <h3 className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(22px, 2.4vw, 32px)" }}>
            {KANTI.name}
          </h3>
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mt-1">{KANTI.tags.join(" / ")}</p>

          <span className="mt-4 inline-flex items-center gap-2 text-kov-bone text-[11px] uppercase tracking-widest">
            <span
              aria-hidden="true"
              className="inline-flex w-7 h-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <ArrowRight size={13} className="group-hover:text-kov-red transition-colors" />
            </span>
            Voir le projet
          </span>
        </div>
      </div>
    </Link>
  );
}
