import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export type ImageAlign = "left" | "center" | "right";

// Image, extended with two custom attributes:
//   width  — a CSS width string, e.g. "50%"
//   align  — "left" | "center" | "right", rendered as float/margin via an
//            inline `style` attribute (not as separate width/align HTML
//            attributes) so pasted-back HTML keeps its layout without any
//            extra CSS on the consuming page (the public /journal renderer
//            just gets a plain <img style="..."> it doesn't need to know
//            anything about).
//
// TipTap v3 note: a per-attribute `renderHTML` callback returns the
// HTML-attribute fragment to merge for *that* attribute; returning `{}`
// excludes it from the auto-generated attributes so it doesn't also show up
// as a literal `width="50%"` / `align="left"` attribute alongside the style
// we build ourselves in the node-level `renderHTML` below (which receives
// `node.attrs` directly, per @tiptap/core's NodeConfig type).
export const RichEditorImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element: HTMLElement) => element.style.width || element.getAttribute("width") || "100%",
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => (element.getAttribute("data-align") as ImageAlign | null) ?? "center",
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const align = (node.attrs.align as ImageAlign) || "center";
    const width = (node.attrs.width as string) || "100%";

    const style =
      align === "left"
        ? `float:left; margin:0 1rem 0.5rem 0; width:${width}`
        : align === "right"
          ? `float:right; margin:0 0 0.5rem 1rem; width:${width}`
          : `display:block; margin:auto; width:${width}`;

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style,
        "data-align": align,
      }),
    ];
  },
});
