"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import MediaLibraryModal from "./media/MediaLibraryModal";

// Image node extended to carry data-media-id, the marker blog.service.ts uses
// to attach/detach body images through the Media lifecycle (see blog.media.ts).
const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-media-id": { default: null },
    };
  },
});

const btn =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors";
const btnIdle = "text-black/60 hover:bg-admin-primary/20 dark:text-white/60 dark:hover:bg-admin-primary/10";
const btnActive = "bg-admin-primary/40 text-black dark:bg-admin-primary/25 dark:text-white";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`${btn} ${active ? btnActive : btnIdle} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const uploadMutation = useUploadMedia();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const insertImage = useCallback(
    (src: string, mediaId: string, alt: string) => {
      editor
        .chain()
        .focus()
        .setImage({ src, alt })
        .updateAttributes("image", { "data-media-id": mediaId })
        .run();
    },
    [editor]
  );

  const addLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (use /path for internal links)", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <>
    <div className="flex flex-wrap items-center gap-1 border-b border-admin-border p-2 dark:border-admin-border-dark">
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <ToolbarButton title="Heading 4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-admin-border dark:bg-admin-border-dark" />
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><span className="underline">U</span></ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><span className="line-through">S</span></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-admin-border dark:bg-admin-border-dark" />
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
      <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{"</>"}</ToolbarButton>
      <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-admin-border dark:bg-admin-border-dark" />
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={addLink}>Link</ToolbarButton>
      <ToolbarButton title="Image" onClick={() => setLibraryOpen(true)} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? "…" : "Image"}</ToolbarButton>
      <ToolbarButton title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</ToolbarButton>
      {editor.isActive("table") && (
        <>
          <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>+Col</ToolbarButton>
          <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>+Row</ToolbarButton>
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>✕Tbl</ToolbarButton>
        </>
      )}
      <span className="mx-1 h-5 w-px bg-admin-border dark:bg-admin-border-dark" />
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>↶</ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>↷</ToolbarButton>
    </div>

    <MediaLibraryModal
      open={libraryOpen}
      mode="single"
      onClose={() => setLibraryOpen(false)}
      onConfirm={(picks) => {
        const p = picks[0];
        if (!p) return;
        const alt =
          p.altText ??
          window.prompt("Alt text (describe the image for SEO & screen readers)", "") ??
          "";
        insertImage(p.url, p.mediaId, alt);
      }}
    />
    </>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  onFocusChange,
}: {
  value: string;
  onChange: (html: string) => void;
  onFocusChange?: (focused: boolean) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // H1 is deliberately excluded — the post title owns the page's single
      // H1. The backend sanitizer also downgrades any stray h1 to h2.
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      BlogImage.configure({ inline: false, HTMLAttributes: { loading: "lazy" } }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "blog-prose max-w-none min-h-[320px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onFocus: () => onFocusChange?.(true),
    onBlur: () => onFocusChange?.(false),
  });

  // Keep the editor in sync when the form is reset from freshly-fetched data
  // (edit page load, duplicate). Guard against clobbering in-progress typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "<p></p>";
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface dark:border-admin-border-dark dark:bg-admin-surface-dark">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
