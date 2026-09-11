import Image from "next/image";
import Link from "next/link";
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
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 80%)" }}
      />
      <div className="relative h-full w-full flex flex-col justify-end p-5">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">{KANTI.category}</p>
        <h3 className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(20px, 2.2vw, 28px)" }}>
          {KANTI.name}
        </h3>
        <p className="text-kov-steel text-[11px] uppercase tracking-widest mt-1">{KANTI.tags.join(" / ")}</p>
        <span
          aria-hidden="true"
          className="mt-3 inline-flex w-8 h-8 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
          style={{ border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-bone">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
