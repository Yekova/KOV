"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline as UnderlineIcon, Heading2, List, ListOrdered, LinkIcon, Quote, Minus } from "lucide-react";
import { EmailVariablePicker } from "./EmailVariablePicker";

// Leaner sibling of the article RichEditor — same TipTap foundation, but
// scoped to exactly what the email module spec asks for (section 11):
// bold/italic/underline/headings/paragraphs/lists/links/quotes/separators/
// variables. No images, no color/highlight, no article picker — none of
// that belongs in a transactional email.
function ToolbarButton({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className="w-8 h-8 flex items-center justify-center transition-colors"
      style={{
        color: active ? "var(--kov-red)" : "var(--kov-steel)",
        background: active ? "rgba(227,30,36,0.12)" : "transparent",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onInsertVariable }: { editor: Editor; onInsertVariable: (key: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-1.5 border-b flex-wrap" style={{ borderColor: "var(--kov-border)" }}>
      <ToolbarButton label="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton label="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton label="Souligné" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton label="Titre" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton label="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton label="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Lien"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("URL du lien :", editor.getAttributes("link").href ?? "https://");
          if (url === null) return;
          if (!url.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url.trim() }).run();
        }}
      >
        <LinkIcon size={14} />
      </ToolbarButton>
      <ToolbarButton label="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton label="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={14} />
      </ToolbarButton>

      <div className="w-px h-5 mx-1" style={{ background: "var(--kov-border)" }} />

      <EmailVariablePicker onSelect={onInsertVariable} />
    </div>
  );
}

export function EmailBodyEditor({
  value,
  onChange,
  placeholder = "Écrivez votre message…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [2] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
    ],
    editorProps: { attributes: { class: "kov-email-editor-content" } },
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "");
  }, [value, editor]);

  function insertVariable(key: string) {
    editor?.chain().focus().insertContent(`{{${key}}}`).run();
  }

  return (
    <div className="flex flex-col">
      {editor ? (
        <>
          <Toolbar editor={editor} onInsertVariable={insertVariable} />
          <div
            className="relative overflow-y-auto"
            style={{ background: "var(--kov-carbon)", minHeight: 260, maxHeight: 420 }}
            onClick={() => editor.chain().focus().run()}
          >
            {editor.isEmpty && (
              <div aria-hidden="true" className="absolute left-0 top-0 p-4 text-sm select-none pointer-events-none" style={{ color: "var(--kov-steel)" }}>
                {placeholder}
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <div className="text-xs px-1 py-2" style={{ color: "var(--kov-steel)" }}>
          Chargement de l&apos;éditeur…
        </div>
      )}

      <style jsx global>{`
        .kov-email-editor-content {
          min-height: 100%;
          padding: 1rem;
          color: var(--kov-bone);
          font-size: 0.9rem;
          line-height: 1.65;
          outline: none;
        }
        .kov-email-editor-content > * + * {
          margin-top: 0.85em;
        }
        .kov-email-editor-content h2 {
          font-size: 1.15rem;
          line-height: 1.3;
          color: var(--kov-bone);
        }
        .kov-email-editor-content p {
          margin: 0;
        }
        .kov-email-editor-content ul,
        .kov-email-editor-content ol {
          padding-left: 1.4em;
        }
        .kov-email-editor-content li + li {
          margin-top: 0.3em;
        }
        .kov-email-editor-content blockquote {
          border-left: 3px solid var(--kov-red);
          padding: 0.2em 0 0.2em 1em;
          color: var(--kov-steel);
          font-style: italic;
        }
        .kov-email-editor-content hr {
          border: none;
          border-top: 1px solid var(--kov-border);
          margin: 1.2em 0;
        }
        .kov-email-editor-content a {
          color: var(--kov-red);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .kov-email-editor-content strong {
          color: var(--kov-white);
        }
      `}</style>
    </div>
  );
}
