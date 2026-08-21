const ICON_WRAPPER_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
} as const;

export function FolderIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M3 6.5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 13v5M9.5 13h1.2a1.5 1.5 0 0 1 0 3H9.5M13.5 18v-5h1.3a1.5 1.5 0 0 1 0 3H13.5M17.5 13v5M17.5 15.3h1.6" />
    </svg>
  );
}

function WordIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9 13l1 5 1.5-5 1.5 5 1-5" />
    </svg>
  );
}

function SheetIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 13l5 5M14.5 13l-5 5" />
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M11.5 12v1.2M11.5 14.4v1.2M11.5 16.8V18" />
      <circle cx="11.5" cy="13.5" r="1.3" />
    </svg>
  );
}

function GenericFileIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_WRAPPER_PROPS} className={className}>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export type DocumentKind = "image" | "pdf" | "word" | "sheet" | "archive" | "generic";

export function documentKindFromMime(mimeType: string | null, filename: string): DocumentKind {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType === "application/msword" || mimeType?.includes("wordprocessingml") || ["doc", "docx"].includes(ext)) return "word";
  if (mimeType === "application/vnd.ms-excel" || mimeType?.includes("spreadsheetml") || ["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  if (mimeType?.includes("zip") || mimeType?.includes("compressed") || ["zip", "rar", "7z"].includes(ext)) return "archive";
  return "generic";
}

export function DocumentTypeIcon({ kind, className }: { kind: DocumentKind; className?: string }) {
  switch (kind) {
    case "pdf":
      return <PdfIcon className={className} />;
    case "word":
      return <WordIcon className={className} />;
    case "sheet":
      return <SheetIcon className={className} />;
    case "archive":
      return <ArchiveIcon className={className} />;
    default:
      return <GenericFileIcon className={className} />;
  }
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
