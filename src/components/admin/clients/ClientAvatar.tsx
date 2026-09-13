import Image from "next/image";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// Real avatar image when one exists (profiles.avatar_path, resolved the
// same way the client portal already does via getPublicAssetUrl), initials
// otherwise — never a bare "-".
export function ClientAvatar({ name, avatarUrl, size = 32 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <span className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-full text-kov-bone"
      style={{
        width: size,
        height: size,
        background: "var(--kov-graphite)",
        border: "1px solid var(--glass-border)",
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}
