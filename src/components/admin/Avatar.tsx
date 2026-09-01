const PALETTE = ["var(--kov-red)", "#5B8DEF", "#9B6DFF", "#F5A524", "#3FB27F", "#F5629B"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs" } as const;

export function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 font-medium text-kov-white ${SIZES[size]}`}
      style={{ background: colorForName(name), borderRadius: "var(--radius-pill)" }}
      title={name}
    >
      {initialsForName(name)}
    </span>
  );
}
