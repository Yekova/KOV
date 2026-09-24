"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, Eye, PenLine } from "lucide-react";
import { VARIABLE_PATTERN, extractVariableKeys, renderPromptMarkdown } from "@/lib/prompts/template";

// L'éditeur de prompt : une zone de saisie monospace dont les {{variables}}
// sont colorées, et qui dit tout de suite lesquelles ne sont pas déclarées.
//
// La coloration se fait avec la technique classique — un calque de texte
// derrière une zone de saisie au texte transparent — mais dans le sens qui
// évite son défaut habituel. D'ordinaire les deux éléments défilent
// séparément et il faut synchroniser leur scrollTop à chaque frappe, ce qui
// décroche à la moindre différence de métrique. Ici c'est le calque qui
// porte la hauteur : il est dans le flux, la zone de saisie est en absolu
// par-dessus, et rien ne défile à l'intérieur. Le bloc grandit avec le
// texte, la page défile, et il n'y a aucune synchronisation à tenir.
//
// Les deux éléments doivent donc partager exactement la même police, la
// même taille, le même interligne et le même rembourrage : c'est ce que
// fait SHARED, et c'est pour ça qu'il est déclaré une seule fois.

const SHARED: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  fontSize: "13px",
  lineHeight: "1.65",
  padding: "14px 16px",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  margin: 0,
  border: "none",
};

export function PromptEditor({
  value,
  onChange,
  declaredKeys,
  onDeclare,
  minHeight = 340,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Les clés qui ont une déclaration. Celles qui n'en ont pas sont
   *  signalées dans le texte même, pas dans un message à côté. */
  declaredKeys: string[];
  onDeclare?: (key: string) => void;
  minHeight?: number;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const declared = useMemo(() => new Set(declaredKeys), [declaredKeys]);
  const usedKeys = useMemo(() => extractVariableKeys(value), [value]);
  const undeclared = useMemo(() => usedKeys.filter((key) => !declared.has(key)), [usedKeys, declared]);
  const unused = useMemo(() => declaredKeys.filter((key) => !usedKeys.includes(key)), [declaredKeys, usedKeys]);

  // Le calque coloré. La dernière ligne vide a besoin d'un caractère pour
  // avoir une hauteur, sinon la zone de saisie dépasse son propre fond dès
  // qu'on termine par un retour à la ligne.
  const highlighted = useMemo(() => {
    const source = value.endsWith("\n") ? `${value} ` : value;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    let index = 0;

    for (const match of source.matchAll(VARIABLE_PATTERN)) {
      const start = match.index ?? 0;
      if (start > cursor) nodes.push(source.slice(cursor, start));
      const key = match[1];
      nodes.push(
        <span
          key={`var-${index++}`}
          style={{
            color: declared.has(key) ? "var(--kov-red)" : "var(--kov-red-signal)",
            background: declared.has(key) ? "rgba(227,30,36,0.10)" : "rgba(255,77,77,0.16)",
            borderRadius: "3px",
            // Un soulignement ondulé pour la variable non déclarée : la
            // couleur seule ne suffit pas à distinguer deux rouges.
            textDecoration: declared.has(key) ? "none" : "underline wavy",
            textUnderlineOffset: "3px",
          }}
        >
          {match[0]}
        </span>
      );
      cursor = start + match[0].length;
    }

    if (cursor < source.length) nodes.push(source.slice(cursor));
    return nodes;
  }, [value, declared]);

  function insertVariable() {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end);
    const token = `{{${selected || "cle"}}}`;
    onChange(value.slice(0, start) + token + value.slice(end));
    // Le curseur se replace sur le nom de la variable, prêt à être tapé.
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + 2, start + 2 + (selected || "cle").length);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={insertVariable}
          className="inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] uppercase tracking-widest text-kov-steel transition-colors hover:text-kov-bone hover:border-kov-red"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          <Braces size={13} /> Variable
        </button>
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          className="inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] uppercase tracking-widest transition-colors hover:border-kov-red"
          style={{
            borderColor: preview ? "var(--kov-red)" : "var(--kov-border)",
            color: preview ? "var(--kov-red)" : "var(--kov-steel)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {preview ? <PenLine size={13} /> : <Eye size={13} />}
          {preview ? "Éditer" : "Voir rendu"}
        </button>

        <span className="text-kov-steel text-[11px] ml-auto tabular-nums">
          {usedKeys.length} variable{usedKeys.length > 1 ? "s" : ""} · {value.length} caractères
        </span>
      </div>

      {preview ? (
        <div
          className="kov-prompt-markdown border overflow-x-auto"
          style={{
            borderColor: "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--kov-carbon)",
            padding: "14px 16px",
            minHeight,
          }}
          // Le HTML vient de renderPromptMarkdown, qui échappe l'entrée
          // avant d'appliquer la moindre règle : les seules balises de cette
          // chaîne sont celles que cette fonction a écrites elle-même.
          dangerouslySetInnerHTML={{ __html: renderPromptMarkdown(value) }}
        />
      ) : (
        <div
          className="relative border focus-within:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)", background: "var(--kov-carbon)" }}
        >
          <pre aria-hidden="true" style={{ ...SHARED, minHeight, color: "var(--kov-concrete)" }}>
            {highlighted}
          </pre>
          <textarea
            ref={areaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            className="absolute inset-0 w-full h-full resize-none bg-transparent focus:outline-none"
            style={{
              ...SHARED,
              color: "transparent",
              caretColor: "var(--kov-bone)",
              overflow: "hidden",
            }}
          />
        </div>
      )}

      {/* La réconciliation entre le texte et les déclarations. Deux sources
          pour une même information dérivent toujours ; la seule défense est
          de montrer l'écart en permanence plutôt que de le découvrir au
          moment d'utiliser le prompt. */}
      {(undeclared.length > 0 || unused.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          {undeclared.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span style={{ color: "var(--kov-red-signal)" }}>Non déclarée{undeclared.length > 1 ? "s" : ""} :</span>
              {undeclared.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onDeclare?.(key)}
                  disabled={!onDeclare}
                  className="font-mono border px-1.5 py-0.5 transition-colors hover:border-kov-red disabled:cursor-default"
                  style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)", color: "var(--kov-bone)" }}
                  title={onDeclare ? `Déclarer ${key}` : undefined}
                >
                  {key}{onDeclare ? " +" : ""}
                </button>
              ))}
            </div>
          )}
          {unused.length > 0 && (
            <span className="text-kov-steel">
              Déclarée{unused.length > 1 ? "s" : ""} mais absente{unused.length > 1 ? "s" : ""} du texte :{" "}
              <span className="font-mono text-kov-concrete">{unused.join(", ")}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
