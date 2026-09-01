import { resolveVariables } from "@/lib/email/variables";

export function EmailPreview({
  toName,
  toEmail,
  subject,
  bodyHtml,
  signatureHtml,
  variableValues,
}: {
  toName: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  signatureHtml: string;
  variableValues: Record<string, string>;
}) {
  const resolvedSubject = resolveVariables(subject, variableValues) || "(sans objet)";
  const resolvedBody = resolveVariables(bodyHtml, variableValues);
  const resolvedSignature = resolveVariables(signatureHtml, variableValues);

  return (
    <div style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}>
      <div className="p-4 space-y-2 border-b" style={{ borderColor: "var(--kov-border)" }}>
        <div>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">À</p>
          <p className="text-kov-bone text-sm">
            {toName} <span className="text-kov-steel">&lt;{toEmail}&gt;</span>
          </p>
        </div>
        <div>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">Objet</p>
          <p className="text-kov-bone text-sm">{resolvedSubject}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="kov-email-preview-body" dangerouslySetInnerHTML={{ __html: resolvedBody || "<p>—</p>" }} />
        {resolvedSignature && (
          <div className="kov-email-preview-body mt-6 pt-4 border-t" style={{ borderColor: "var(--kov-border)" }} dangerouslySetInnerHTML={{ __html: resolvedSignature }} />
        )}
      </div>

      <style jsx global>{`
        .kov-email-preview-body {
          color: var(--kov-bone);
          font-size: 0.9rem;
          line-height: 1.65;
        }
        .kov-email-preview-body > * + * {
          margin-top: 0.85em;
        }
        .kov-email-preview-body h2 {
          font-size: 1.1rem;
        }
        .kov-email-preview-body a {
          color: var(--kov-red);
        }
        .kov-email-preview-body blockquote {
          border-left: 3px solid var(--kov-red);
          padding-left: 1em;
          color: var(--kov-steel);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
