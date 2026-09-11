import Image from "next/image";
import Link from "next/link";

export function Studio360Content() {
  return (
    <Link href="/studio" className="group relative block h-full w-full overflow-hidden" style={{ borderRadius: 20 }}>
      <Image
        src="/studio/covers/studio-detail-01.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 15vw, 40vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 65%)" }}
      />
      <div className="relative h-full w-full flex flex-col justify-end p-4">
        <p className="text-kov-bone text-xs uppercase tracking-widest">Studio 360°</p>
        <span className="inline-flex items-center gap-1 text-kov-red text-[10px] uppercase tracking-widest mt-1 group-hover:text-kov-red-signal transition-colors">
          Explore →
        </span>
      </div>
    </Link>
  );
}
