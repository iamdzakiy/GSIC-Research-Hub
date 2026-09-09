"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, Newspaper, Search, Tag } from "lucide-react";
import { BlogPost } from "@/lib/types";
import { getBlogPosts } from "@/services/blog";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/ui/GlassCard";
import SkeletonCard from "@/components/ui/SkeletonCard";

function readingTime(c: string): number {
  const w = (c || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(w / 200));
}
function fmtDate(d?: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function excerptOf(p: BlogPost): string {
  if (p.excerpt) return p.excerpt;
  const t = (p.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > 140 ? t.slice(0, 140).trimEnd() + "…" : t;
}
export default function BlogIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-white/40">Loading articles…</div>}>
      <BlogIndexContent />
    </Suspense>
  );
}

function BlogIndexContent() {
  const sp = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(sp.get("tag") || "");
  const [query, setQuery] = useState("");
  useEffect(() => { setActiveTag(sp.get("tag") || ""); }, [sp]);
  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const q: Record<string, string | number> = { pageSize: 60, status: "published" };
        if (activeTag) q.tag = activeTag;
        if (query.trim()) q.search = query.trim();
        const res = await getBlogPosts(q);
        if (on) setPosts(res.posts);
      } catch (e) { console.error(e); } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [activeTag, query]);
  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    posts.forEach((p) => (p.tags || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [posts]);
  return (
    <div className="min-h-screen bg-hero-gradient font-body pt-20 mesh-gradient">
      <Navbar />
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-7 h-7 text-[#5CE3B6]" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-white tracking-tight">
              Blog <span className="gradient-text-accent">&amp; Insights</span>
            </h1>
          </div>
          <p className="text-sm text-white/50 max-w-2xl">Stories, guides, and research notes from the GSIC community.</p>
        </motion.div>
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-3">
          <label className="relative flex-1 max-w-md">
            <span className="sr-only">Search articles</span>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles…"
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none input-glow" />
          </label>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tag">
            <button onClick={() => setActiveTag("")} aria-pressed={activeTag === ""}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${activeTag === "" ? "bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] border-transparent text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10"}`}>All</button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? "" : t)} aria-pressed={activeTag === t}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium inline-flex items-center gap-1 ${activeTag === t ? "bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] border-transparent text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10"}`}>
                <Tag className="w-3 h-3" aria-hidden="true" /> {t}</button>
            ))}
          </div>
        </div>
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading articles">
              {[0, 1, 2, 3, 4, 5].map((i) => (<SkeletonCard key={i} lines={3} />))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Newspaper className="w-12 h-12 mx-auto mb-4 text-white/20" aria-hidden="true" />
              <h2 className="text-lg font-bold font-heading text-white">No articles found</h2>
              <p className="text-sm text-white/40 mt-1">Try a different search or tag.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, idx) => {
                const rt = post.readingTimeMinutes || readingTime(post.content);
                return (
                  <GlassCard key={post.id} glow className="p-0 flex flex-col">
                    {post.coverImage && (
                      <Link href={`/blog/${post.slug}`} aria-label={`Read: ${post.title}`}
                        className="block overflow-hidden rounded-t-2xl">
                        <img src={post.coverImage} alt={post.title} loading={idx > 2 ? "lazy" : undefined}
                          className="w-full h-44 object-cover hover:scale-105 transition duration-500" />
                      </Link>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <Link href={`/blog/${post.slug}`} className="group">
                        <h2 className="text-base font-bold font-heading text-white leading-snug group-hover:text-[#5CE3B6] transition line-clamp-2">{post.title}</h2>
                      </Link>
                      <p className="text-xs text-white/50 mt-2 line-clamp-2 leading-relaxed">{excerptOf(post)}</p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden" aria-hidden="true">
                          {post.author?.avatarUrl ? (<img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />) : ((post.author?.name || "G").charAt(0).toUpperCase())}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white/80 font-medium truncate">{post.author?.name || "GSIC Team"}</div>
                          <div className="text-[11px] text-white/40 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" /> {fmtDate(post.publishedAt || post.createdAt)}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> {rt} min</span>
                          </div>
                        </div>
                        <Link href={`/blog/${post.slug}`} aria-label={`Read article: ${post.title}`}
                          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition flex-shrink-0">
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
