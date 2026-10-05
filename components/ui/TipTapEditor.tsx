"use client";

// Word-style editor for blog posts. Shows a white "page" so what the admin sees is close to what readers get.
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Code2, Link as LinkIcon, Unlink,
  Image as ImageIcon, Undo2, Redo2, Minus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getAuthHeaders } from "@/lib/apiFetch";

interface Props { value: string; onChange: (html: string) => void; placeholder?: string; className?: string }

/** Uploads through the admin-only /api/upload route (service role, public bucket). */
export async function uploadImage(file: File): Promise<string> {
  const headers = await getAuthHeaders();
  delete headers["Content-Type"]; // the browser sets the multipart boundary
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", headers, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url as string;
}

function Btn({ onClick, active, disabled, title, children }: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} disabled={disabled} title={title} aria-label={title} aria-pressed={active}
      className={cn("rounded-md p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-30", active && "bg-brand-600 text-white hover:bg-brand-700")}>
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />;

export default function TipTapEditor({ value, onChange, placeholder, className }: Props) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: placeholder || "Start writing…" }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[340px] px-8 py-7 focus:outline-none prose-headings:font-heading prose-headings:tracking-tight " +
          "prose-a:text-brand-700 prose-img:mx-auto prose-img:rounded-lg prose-blockquote:border-l-brand-600 prose-blockquote:not-italic",
      },
      handlePaste: (_v, ev) => {
        const f = Array.from(ev.clipboardData?.files ?? []).find((x) => x.type.startsWith("image/"));
        if (!f) return false;
        void insert(f);
        return true;
      },
      handleDrop: (_v, ev) => {
        const f = Array.from((ev as DragEvent).dataTransfer?.files ?? []).find((x) => x.type.startsWith("image/"));
        if (!f) return false;
        ev.preventDefault();
        void insert(f);
        return true;
      },
    },
  });

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, false);
  }, [value, editor]);

  async function insert(file: File) {
    if (!editor) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !editor) return <div className={cn("h-[420px] animate-pulse rounded-xl bg-slate-100", className)} />;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address", prev || "https://");
    if (url === null) return;
    if (!url) return void editor.chain().focus().extendMarkRange("link").unsetLink().run();
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const block = editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p";
  const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-300 bg-slate-100 text-slate-900", className)}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-slate-300 bg-slate-50 px-2 py-1.5">
        <select aria-label="Text style" value={block}
          onChange={(e) => {
            const v = e.target.value;
            const c = editor.chain().focus();
            (v === "p" ? c.setParagraph() : c.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 })).run();
          }}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800">
          <option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <Sep />
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
        <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
        <Sep />
        <Btn title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="h-4 w-4" /></Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
        <Sep />
        <Btn title="Add link" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="h-4 w-4" /></Btn>
        <Btn title="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}><Unlink className="h-4 w-4" /></Btn>
        <Btn title="Insert image" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Btn>
        <Sep />
        <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
        <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void insert(f); e.target.value = ""; }} />
      </div>
      <div className="max-h-[62vh] overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto max-w-3xl rounded-md bg-white shadow-sm ring-1 ring-slate-200"><EditorContent editor={editor} /></div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        <span>{words} {words === 1 ? "word" : "words"} · paste or drop images straight into the page</span>
        {err && <span role="alert" className="text-rose-600">{err}</span>}
      </div>
    </div>
  );
}
