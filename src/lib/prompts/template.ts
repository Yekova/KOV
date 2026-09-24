// Le moteur de gabarit, et rien d'autre.
//
// Pur, sans dépendance, sans "server-only" : le même code tourne dans le
// navigateur pour la prévisualisation en direct et sur le serveur pour la
// génération enregistrée. Deux implémentations qui divergeraient d'un
// espace produiraient deux sorties différentes pour un même prompt, ce qui
// viderait le journal d'usage de son sens.

/** {{cle}}, avec espaces tolérés à l'intérieur des accolades. Le jeu de
 *  caractères est volontairement étroit : une clé est un identifiant, pas
 *  une expression. */
export const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

/** Les clés réellement présentes dans le texte, dédoublonnées, dans l'ordre
 *  d'apparition — c'est l'ordre dans lequel l'auteur les a écrites, donc
 *  l'ordre dans lequel le formulaire doit les demander. */
export function extractVariableKeys(content: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export interface RenderResult {
  output: string;
  /** Les clés laissées telles quelles faute de valeur. Affichées au-dessus
   *  du résultat : une variable non remplie doit se voir dans la sortie ET
   *  être nommée, pas disparaître en silence. */
  unfilled: string[];
}

/** Substitue les valeurs fournies.
 *
 *  Une clé sans valeur n'est pas effacée : elle reste visible sous la forme
 *  {{cle}} dans la sortie. Effacer produirait « Secteur : » suivi de rien,
 *  qu'on ne remarque qu'après avoir collé le prompt ailleurs. */
export function renderTemplate(content: string, values: Record<string, string>): RenderResult {
  const unfilled: string[] = [];

  const output = content.replace(VARIABLE_PATTERN, (token, key: string) => {
    const value = values[key];
    if (value === undefined || value.trim() === "") {
      if (!unfilled.includes(key)) unfilled.push(key);
      return token;
    }
    return value;
  });

  return { output, unfilled };
}

/** "client_name" → "Client name". Un libellé par défaut, pour que déclarer
 *  une variable ne demande pas de remplir deux champs au lieu d'un. */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Un slug, aux mêmes règles que partout ailleurs dans cette base. */
export function slugifyPrompt(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Rendu Markdown ───────────────────────────────────────────────────────
//
// Un sous-ensemble volontairement petit, écrit ici plutôt qu'ajouté en
// dépendance : les prompts contiennent des titres, des listes et des blocs
// de code, pas des tableaux ni des notes de bas de page.
//
// La sécurité tient à l'ordre des opérations, pas à un nettoyage après
// coup : tout est échappé d'abord, donc le texte sur lequel les règles
// s'appliquent ne contient plus aucune balise. Les seules balises de la
// sortie sont celles que cette fonction écrit elle-même. C'est pour ça
// qu'il n'y a pas de DOMPurify ici — il n'y a rien à purifier.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** http(s) et chemins relatifs. Une URL `javascript:` dans un lien Markdown
 *  est le seul vecteur qui survivrait à l'échappement, puisqu'elle finit
 *  dans un attribut href que cette fonction écrit elle-même. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/[^/]/.test(trimmed) || trimmed.startsWith("#")) return trimmed;
  return null;
}

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="kov-md-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) => {
      const safe = safeHref(href);
      if (!safe) return label;
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

export function renderPromptMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split("\n");
  const html: string[] = [];

  let inCodeFence = false;
  let listKind: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listKind) {
      html.push(`</${listKind}>`);
      listKind = null;
    }
  };

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      closeParagraph();
      closeList();
      html.push(inCodeFence ? "</code></pre>" : '<pre class="kov-md-pre"><code>');
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      html.push(line);
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*([-*_])\s*\1\s*\1[\s-*_]*$/.test(line)) {
      closeParagraph();
      closeList();
      html.push("<hr />");
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      closeParagraph();
      const kind = bullet ? "ul" : "ol";
      if (listKind !== kind) {
        closeList();
        html.push(`<${kind}>`);
        listKind = kind;
      }
      html.push(`<li>${inline((bullet ?? ordered)![1])}</li>`);
      continue;
    }

    const quote = /^\s*&gt;\s?(.*)$/.exec(line);
    if (quote) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  closeParagraph();
  closeList();
  if (inCodeFence) html.push("</code></pre>");

  return html.join("\n");
}
