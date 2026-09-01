"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Palette,
  Eraser,
  Highlighter,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Link2Off,
  Newspaper,
  ImagePlus,
  FileText,
  FileType,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import mammoth from "mammoth";
import { uploadEditorImage } from "@/app/admin/content/actions";
import { ToolbarButton, ToolbarRow, ToolbarDivider } from "./ToolbarButton";

// pdfjs-dist is only ever needed inside handlePdfChange (a client-only
// event handler), so it's dynamically imported there rather than at module
// scope — keeps it (and its worker) out of the initial bundle entirely
// until an admin actually clicks "Importer un PDF", and sidesteps any
// ambiguity about pdfjs-dist's module-level behavior running during the
// Next.js SSR pass of this "use client" component.
//
// The worker URL itself is just string/URL construction (no DOM access),
// so it's safe and cheap to compute eagerly at module scope. `new
// URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` is the
// pattern Next.js documents for referencing a node_modules asset from a
// client component in both Webpack and Turbopack — Turbopack statically
// finds the string literal and emits the worker file as its own bundled
// asset with a resolvable URL at runtime.
const PDF_WORKER_URL = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const LINK_URL_PATTERN = /^(https?:\/\/|mailto:|tel:)/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface RichEditorToolbarProps {
  editor: Editor;
  onOpenArticlePicker: () => void;
}

export function RichEditorToolbar({ editor, onOpenArticlePicker }: RichEditorToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [imageUploading, setImageUploading] = useState(false);
  const [docxImporting, setDocxImporting] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);

  function requireSelection(): boolean {
    if (editor.state.selection.empty) {
      toast.error("Sélectionnez d'abord du texte");
      return false;
    }
    return true;
  }

  function handleExternalLink() {
    if (!requireSelection()) return;
    const url = window.prompt("URL du lien");
    if (!url) return;
    if (!LINK_URL_PATTERN.test(url)) {
      toast.error("URL invalide — elle doit commencer par http://, https://, mailto: ou tel:");
      return;
    }
    editor.chain().focus().setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
  }

  function handleUnlink() {
    editor.chain().focus().unsetLink().run();
  }

  function handleOpenArticlePicker() {
    if (!requireSelection()) return;
    onOpenArticlePicker();
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadEditorImage(formData);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Le téléversement a échoué.");
        return;
      }
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch {
      toast.error("Le téléversement a échoué.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleDocxChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setDocxImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor.commands.setContent(result.value);
      toast.success("Document importé");
    } catch {
      toast.error("L'import du document a échoué.");
    } finally {
      setDocxImporting(false);
    }
  }

  async function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPdfImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageTexts: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
        pageTexts.push(pageText);
      }

      editor.commands.setContent(`<p>${escapeHtml(pageTexts.join("\n\n"))}</p>`);
      toast.success("PDF importé (texte uniquement)");
    } catch {
      toast.error("L'import du PDF a échoué.");
    } finally {
      setPdfImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 border" style={{ background: "var(--kov-graphite)", borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
      {/* Row 1 — inline formatting */}
      <ToolbarRow>
        <ToolbarButton title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Souligné" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Couleur du texte" onClick={() => colorInputRef.current?.click()}>
          <Palette size={16} />
        </ToolbarButton>
        <input
          ref={colorInputRef}
          type="color"
          className="hidden"
          onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        />
        <ToolbarButton title="Réinitialiser la couleur" onClick={() => editor.chain().focus().unsetColor().run()}>
          <Eraser size={16} />
        </ToolbarButton>
        <ToolbarButton title="Surligner" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Titre H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Titre H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Paragraphe" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justifier" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify size={16} />
        </ToolbarButton>
      </ToolbarRow>

      {/* Row 2 — insertions */}
      <ToolbarRow>
        <ToolbarButton title="Insérer un lien" onClick={handleExternalLink}>
          <Link2 size={16} />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton title="Retirer le lien" onClick={handleUnlink}>
            <Link2Off size={16} />
          </ToolbarButton>
        )}
        <ToolbarButton title="Lier à un article interne" onClick={handleOpenArticlePicker}>
          <Newspaper size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Insérer une image" disabled={imageUploading} onClick={() => imageInputRef.current?.click()}>
          {imageUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </ToolbarButton>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        <ToolbarButton title="Importer un .docx" disabled={docxImporting} onClick={() => docxInputRef.current?.click()}>
          {docxImporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        </ToolbarButton>
        <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleDocxChange} />

        <ToolbarButton title="Importer un PDF" disabled={pdfImporting} onClick={() => pdfInputRef.current?.click()}>
          {pdfImporting ? <Loader2 size={16} className="animate-spin" /> : <FileType size={16} />}
        </ToolbarButton>
        <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfChange} />
      </ToolbarRow>
    </div>
  );
}
