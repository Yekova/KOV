import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Studio360Content() {
  return (
    <Link href="/studio" className="group relative block h-full w-full overflow-hidden" style={{ borderRadius: 20 }}>
      <Image
        src="/studio/covers/studio-detail-01.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 15vw, 40vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        style={{ transformOrigin: "60% 50%" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)" }}
      />

      <div className="relative h-full w-full flex flex-col justify-between p-4">
        <p className="flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
          KOV Studio
        </p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-kov-bone text-xs uppercase tracking-widest">Studio 360°</p>
            <span className="inline-flex items-center gap-1 text-kov-red text-[10px] uppercase tracking-widest mt-1 group-hover:text-kov-red-signal transition-colors">
              Explorer
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          {/* A small "360°" indicator that only appears on hover — a real
              functional cue (this is a rotatable panorama), not decoration. */}
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-full flex items-center justify-center text-kov-bone text-[8px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ border: "1px solid rgba(255,255,255,0.3)" }}
          >
            360°
          </span>
        </div>
      </div>
    </Link>
  );
}
