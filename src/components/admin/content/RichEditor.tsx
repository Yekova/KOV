"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

import type { PostRow } from "@/app/admin/content/actions";
import { RichEditorImage } from "./RichEditorImage";
import { RichEditorToolbar } from "./RichEditorToolbar";
import { RichEditorImageToolbar } from "./RichEditorImageToolbar";
import { ArticlePickerModal } from "./ArticlePickerModal";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** If true, the editor fills all available height (flex-1) instead of a fixed min-height. */
  fullscreen?: boolean;
  placeholder?: string;
}

export function RichEditor({
  value,
  onChange,
  fullscreen = false,
  placeholder = "Commencez à écrire votre article…",
}: RichEditorProps) {
  const [articlePickerOpen, setArticlePickerOpen] = useState(false);

  const editor = useEditor({
    // Next.js SSRs "use client" components too — immediatelyRender: false
    // avoids the hydration mismatch that would otherwise happen because the
    // editor's initial empty content never matches what the (async, DB-
    // loaded) `value` prop fills in a moment later. TipTap v3 auto-detects
    // Next.js and defaults this to false already, but setting it explicitly
    // silences the dev-mode warning and documents the intent.
    immediatelyRender: false,
    // TipTap v3 changed useEditor's default: it no longer re-renders its
    // owning component on every transaction (shouldRerenderOnTransaction
    // now defaults to false, "legacy behavior" in v2). Without this, every
    // toolbar button's active/pressed state and the contextual image
    // toolbar's visibility (editor.isActive('image')) would go stale after
    // the first render — clicks would still work, but the UI wouldn't
    // reflect them until something unrelated forced a re-render.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // TipTap v3's StarterKit now bundles Link and Underline itself
        // (neither existed in v2's StarterKit). Left enabled, they'd
        // register a second "link"/"underline" extension alongside the
        // explicitly-configured ones below and TipTap would warn about
        // duplicate extension names — disable the bundled ones here so our
        // own configured instances are the only ones registered.
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      RichEditorImage,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editorProps: {
      attributes: {
        class: "kov-rich-editor-content",
      },
    },
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // `value` arrives asynchronously (loaded from the DB) after the editor
  // has already mounted with an empty string — this keeps the editor in
  // sync whenever the prop changes out from under it, without fighting the
  // user's own edits (onChange already keeps `value` current as they type,
  // so this only actually replaces content on the initial async load).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
  }, [value, editor]);

  function handlePickArticle(article: PostRow) {
    if (!editor) return;
    editor.chain().focus().setLink({ href: `/journal/${article.slug}`, target: "_self" }).run();
    setArticlePickerOpen(false);
  }

  return (
    <div className={`flex flex-col gap-2 ${fullscreen ? "h-full min-h-0" : ""}`}>
      {editor ? (
        <>
          <RichEditorToolbar editor={editor} onOpenArticlePicker={() => setArticlePickerOpen(true)} />
          {editor.isActive("image") && <RichEditorImageToolbar editor={editor} />}

          <div
            className={`relative border ${fullscreen ? "flex-1 min-h-0 overflow-y-auto" : "overflow-y-auto"}`}
            style={{
              borderColor: "var(--kov-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--kov-carbon)",
              minHeight: fullscreen ? undefined : 400,
            }}
            onClick={() => editor.chain().focus().run()}
          >
            {editor.isEmpty && (
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 p-4 text-sm select-none pointer-events-none"
                style={{ color: "var(--kov-steel)" }}
              >
                {placeholder}
              </div>
            )}
            <EditorContent editor={editor} className="h-full" />
          </div>
        </>
      ) : (
        <div className="text-xs px-1 py-2" style={{ color: "var(--kov-steel)" }}>
          Chargement de l&apos;éditeur…
        </div>
      )}

      {articlePickerOpen && (
        <ArticlePickerModal onClose={() => setArticlePickerOpen(false)} onSelect={handlePickArticle} />
      )}

      {/* Typography for the rendered HTML — no @tailwindcss/typography in
          this codebase, so these are hand-written, scoped by the
          .kov-rich-editor-content class TipTap applies directly to the
          contenteditable root (see editorProps.attributes.class above).
          `<style jsx global>` is required rather than plain `<style jsx>`:
          styled-jsx's automatic scoping only tags elements that are
          literally written in this component's JSX — the h2/p/li/img nodes
          here are rendered dynamically by ProseMirror, so a non-global
          `<style jsx>` block would silently never match them. The
          .kov-rich-editor-content prefix on every rule is what actually
          keeps this from leaking onto the rest of the page. */}
      <style jsx global>{`
        .kov-rich-editor-content {
          min-height: 100%;
          padding: 1rem;
          color: var(--kov-bone);
          font-size: 0.95rem;
          line-height: 1.7;
          outline: none;
        }
        .kov-rich-editor-content::after {
          content: "";
          display: table;
          clear: both;
        }
        .kov-rich-editor-content > * + * {
          margin-top: 0.9em;
        }
        .kov-rich-editor-content h2 {
          font-family: var(--font-display, inherit);
          font-size: 1.5rem;
          line-height: 1.25;
          color: var(--kov-bone);
          margin-top: 1.5em;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .kov-rich-editor-content h3 {
          font-family: var(--font-display, inherit);
          font-size: 1.2rem;
          line-height: 1.3;
          color: var(--kov-bone);
          margin-top: 1.3em;
        }
        .kov-rich-editor-content p {
          margin: 0;
        }
        .kov-rich-editor-content ul,
        .kov-rich-editor-content ol {
          padding-left: 1.4em;
        }
        .kov-rich-editor-content li + li {
          margin-top: 0.3em;
        }
        .kov-rich-editor-content li::marker {
          color: var(--kov-red);
        }
        .kov-rich-editor-content blockquote {
          border-left: 3px solid var(--kov-red);
          padding: 0.2em 0 0.2em 1em;
          color: var(--kov-steel);
          font-style: italic;
        }
        .kov-rich-editor-content strong {
          color: var(--kov-white);
        }
        .kov-rich-editor-content a {
          color: var(--kov-red);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .kov-rich-editor-content a:hover {
          color: var(--kov-red-signal);
        }
        .kov-rich-editor-content img {
          max-width: 100%;
          border-radius: var(--radius-sm);
        }
        .kov-rich-editor-content mark {
          border-radius: 2px;
          padding: 0 0.15em;
        }
        .kov-rich-editor-content.ProseMirror-focused {
          outline: none;
        }
      `}</style>
    </div>
  );
}
