"use client";

import { useMemo } from "react";

// Une comparaison ligne à ligne, écrite ici plutôt qu'ajoutée en dépendance.
//
// L'algorithme est la plus longue sous-séquence commune, en table. C'est
// quadratique, ce qui serait un mauvais choix sur un dépôt entier et un
// choix sans conséquence sur deux versions d'un prompt : quelques centaines
// de lignes de part et d'autre, soit une table qui tient dans une frame.
//
// Ce qu'on affiche est volontairement pauvre — ajouts, suppressions,
// contexte — parce que la question posée à cet écran est « qu'est-ce qui a
// changé entre la v5 et la v7 », pas « fusionne-les ».

type Op = { kind: "same" | "add" | "remove"; text: string };

function diffLines(before: string, after: string): Op[] {
  const a = before.split("\n");
  const b = after.split("\n");

  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ kind: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ kind: "remove", text: a[i] });
      i += 1;
    } else {
      ops.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) ops.push({ kind: "remove", text: a[i++] });
  while (j < b.length) ops.push({ kind: "add", text: b[j++] });

  return ops;
}

/** Réduit les longues plages identiques à trois lignes de contexte de part
 *  et d'autre. Sans ça, un changement d'une ligne dans un prompt de deux
 *  cents se cherche à la loupe. */
function collapse(ops: Op[], context = 3): (Op | { kind: "gap"; count: number })[] {
  const keep = new Set<number>();
  ops.forEach((op, index) => {
    if (op.kind === "same") return;
    for (let offset = -context; offset <= context; offset += 1) {
      const target = index + offset;
      if (target >= 0 && target < ops.length) keep.add(target);
    }
  });

  const output: (Op | { kind: "gap"; count: number })[] = [];
  let gap = 0;
  ops.forEach((op, index) => {
    if (keep.has(index)) {
      if (gap) {
        output.push({ kind: "gap", count: gap });
        gap = 0;
      }
      output.push(op);
    } else {
      gap += 1;
    }
  });
  if (gap) output.push({ kind: "gap", count: gap });
  return output;
}

const STYLES: Record<Op["kind"], React.CSSProperties> = {
  same: { color: "var(--kov-steel)" },
  add: { color: "var(--kov-bone)", background: "rgba(120,200,140,0.10)" },
  remove: { color: "var(--kov-concrete)", background: "rgba(227,30,36,0.12)" },
};

const MARKS: Record<Op["kind"], string> = { same: " ", add: "+", remove: "-" };

export function PromptDiff({ before, after }: { before: string; after: string }) {
  const rows = useMemo(() => collapse(diffLines(before, after)), [before, after]);
  const changes = rows.filter((row) => row.kind === "add" || row.kind === "remove").length;

  if (changes === 0) {
    return <p className="text-kov-steel text-xs">Contenu identique.</p>;
  }

  return (
    <div
      className="border overflow-x-auto"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)", background: "var(--kov-carbon)" }}
    >
      <pre
        className="text-[11px] leading-relaxed"
        style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace", margin: 0, padding: "10px 0" }}
      >
        {rows.map((row, index) =>
          row.kind === "gap" ? (
            <div key={index} className="px-3 py-1 text-kov-steel opacity-60">
              ⋯ {row.count} ligne{row.count > 1 ? "s" : ""} inchangée{row.count > 1 ? "s" : ""}
            </div>
          ) : (
            <div key={index} className="px-3 whitespace-pre-wrap" style={STYLES[row.kind]}>
              <span aria-hidden="true" className="select-none opacity-70">
                {MARKS[row.kind]}{" "}
              </span>
              {row.text || " "}
            </div>
          )
        )}
      </pre>
    </div>
  );
}
