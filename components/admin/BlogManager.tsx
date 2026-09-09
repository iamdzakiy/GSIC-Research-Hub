"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Pencil, Globe, FileWarning, Save, Clock } from "lucide-react";
import { BlogPost, PostStatus } from "@/lib/types";
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, CreateBlogInput } from "@/services/blog";
import TipTapEditor from "@/components/ui/TipTapEditor";
import { cn } from "@/lib/cn";

interface Draft {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  tags: string;
  slug: string;
  status: "draft" | "published";
}

const emptyDraft = (): Draft => ({
  title: "",
  content: "<p></p>",
  excerpt: "",
  coverImage: "",
  tags: "",
  slug: "",
  status: "draft",
});

function fmtDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | PostStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [drafts, published] = await Promise.all([
        getBlogPosts({ pageSize: 100, status: "draft" }),
        getBlogPosts({ pageSize: 100, status: "published" }),
      ]);
      setPosts([...published.posts, ...drafts.posts]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setDraft({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      coverImage: post.coverImage || "",
      tags: (post.tags || []).join(", "),
      slug: post.slug,
      status: post.status,
    });
    setError(null);
    setEditorOpen(true);
  };

  const toggleStatus = async (post: BlogPost) => {
    const next: PostStatus = post.status === "published" ? "draft" : "published";
    await updateBlogPost(post.id, { status: next });
    await load();
  };

  const remove = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    await deleteBlogPost(post.id);
    await load();
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.content || draft.content === "<p></p>") {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateBlogInput = {
        title: draft.title.trim(),
        content: draft.content,
        excerpt: draft.excerpt.trim() || undefined,
        coverImage: draft.coverImage.trim() || undefined,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        slug: draft.slug.trim() || undefined,
        status: draft.status,
      };
      if (editingId) {
        await updateBlogPost(editingId, payload);
      } else {
        await createBlogPost(payload);
      }
      setEditorOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeFilter === "all" ? posts : posts.filter((p) => p.status === activeFilter);
  const ordered = [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold flex items-center gap-2 font-heading">
            <Pencil className="w-4 h-4 text-[#5CE3B6]" /> Blog Posts ({posts.length})
          </h3>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] text-white px-4 py-2 rounded-full font-medium transition"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={cn("text-xs px-3 py-1.5 rounded-full border capitalize transition", activeFilter === f ? "bg-[#3352CD]/40 border-[#3352CD] text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white")}
            >{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-white/30">Loading posts…</div>
        ) : ordered.length === 0 ? (
          <div className="text-center py-10 text-white/30">No blog posts yet. Create your first post.</div>
        ) : (
          <div className="space-y-2">
            {ordered.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-[10px] text-white/30 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDate(post.publishedAt || post.createdAt)}</span>
                    <span className={cn("flex items-center gap-1", post.status === "published" ? "text-[#5CE3B6]" : "text-[#F2F8C9]")}>
                      {post.status === "published" ? <Globe className="w-3 h-3" /> : <FileWarning className="w-3 h-3" />}
                      {post.status}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(post)}
                    title={post.status === "published" ? "Move to draft" : "Publish"}
                    className={cn("text-xs px-2.5 py-1 rounded-full border transition",
                      post.status === "published" ? "bg-[#5CE3B6]/15 text-[#5CE3B6] border-[#5CE3B6]/30 hover:bg-[#5CE3B6]/25" : "bg-[#F2F8C9]/15 text-[#F2F8C9] border-[#F2F8C9]/30 hover:bg-[#F2F8C9]/25")}
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => remove(post)} className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-[105] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-3xl glass-strong rounded-2xl border border-white/10 shadow-2xl my-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-bold text-white font-heading">{editingId ? "Edit Post" : "New Post"}</h3>
              <button onClick={() => setEditorOpen(false)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Post title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-heading font-semibold text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60"
              />
              <TipTapEditor value={draft.content} onChange={(html) => setDraft({ ...draft, content: html })} placeholder="Write your article…" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} placeholder="Short excerpt (optional)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60" />
                <input value={draft.coverImage} onChange={(e) => setDraft({ ...draft, coverImage: e.target.value })} placeholder="Cover image URL (optional)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60" />
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="URL slug (auto)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60" />
                <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="Tags (comma separated)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <label className="text-xs text-white/60 mr-auto flex items-center gap-2">
                  Status
                  <button
                    onClick={() => setDraft((d) => ({ ...d, status: d.status === "published" ? "draft" : "published" }))}
                    className={cn("text-xs px-3 py-1 rounded-full border transition",
                      draft.status === "published" ? "bg-[#5CE3B6]/20 text-[#5CE3B6] border-[#5CE3B6]/40" : "bg-[#F2F8C9]/20 text-[#F2F8C9] border-[#F2F8C9]/40")}
                  >
                    {draft.status === "published" ? "Published" : "Draft"}
                  </button>
                </label>
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] text-white px-5 py-2 rounded-full font-medium shadow-lg disabled:opacity-50 transition">
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Post"}
                </button>
              </div>
              {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}