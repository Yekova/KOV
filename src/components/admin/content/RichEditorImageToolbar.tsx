"use client";

import type { Editor } from "@tiptap/core";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import { ToolbarButton, ToolbarRow, ToolbarDivider } from "./ToolbarButton";
import type { ImageAlign } from "./RichEditorImage";

const SIZES = ["25%", "50%", "75%", "100%"];

// Contextual toolbar shown right under the main toolbar whenever an image
// node is selected (editor.isActive('image')) — no floating-position logic,
// it's just another block in RichEditor's normal document flow.
export function RichEditorImageToolbar({ editor }: { editor: Editor }) {
  const currentWidth = editor.getAttributes("image").width as string | undefined;
  const currentAlign = (editor.getAttributes("image").align as ImageAlign | undefined) ?? "center";

  function setWidth(width: string) {
    editor.chain().focus().updateAttributes("image", { width }).run();
  }

  function setAlign(align: ImageAlign) {
    editor.chain().focus().updateAttributes("image", { align }).run();
  }

  return (
    <div
      className="flex flex-col gap-2 p-2 border"
      style={{ background: "var(--kov-carbon)", borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      <ToolbarRow>
        <span className="text-[10px] uppercase tracking-widest px-1" style={{ color: "var(--kov-steel)" }}>
          Image
        </span>

        <ToolbarDivider />

        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setWidth(size)}
            className="px-2 h-8 text-xs border transition-colors"
            style={{
              borderRadius: "var(--radius-sm)",
              borderColor: currentWidth === size ? "var(--kov-red)" : "var(--kov-border)",
              color: currentWidth === size ? "var(--kov-red)" : "var(--kov-steel)",
              background: currentWidth === size ? "rgba(227, 30, 36, 0.12)" : "transparent",
            }}
          >
            {size}
          </button>
        ))}

        <ToolbarDivider />

        <ToolbarButton title="Aligner à gauche" active={currentAlign === "left"} onClick={() => setAlign("left")}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Centrer" active={currentAlign === "center"} onClick={() => setAlign("center")}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Aligner à droite" active={currentAlign === "right"} onClick={() => setAlign("right")}>
          <AlignRight size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton title="Supprimer l'image" onClick={() => editor.chain().focus().deleteSelection().run()}>
          <Trash2 size={16} />
        </ToolbarButton>
      </ToolbarRow>
    </div>
  );
}
