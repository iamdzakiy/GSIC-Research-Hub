"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Calendar, Share2, Tag, Check } from "lucide-react";
import { BlogPost } from "@/lib/types";
import { getBlogPostBySlug } from "@/services/blog";
import RichTextRenderer from "@/components/ui/RichTextRenderer";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { cn } from "@/lib/cn";

function readingTime(content: string): number {
  const words = (content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(d?: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await getBlogPostBySlug(slug);
        if (!active) return;
        if (!p) {
          setNotFound(true);
        } else {
          setPost(p);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen pt-40 pb-20 px-4 text-center">
        <h1 className="text-3xl font-bold text-white font-heading">Article not found</h1>
        <button onClick={() => router.push("/blog")} className="mt-6 text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-white/70 transition">
          Back to Blog
        </button>
      </div>
    );
  }

  const rtime = post.readingTimeMinutes || readingTime(post.content);

  return (
    <article id="main-content" className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-[#5CE3B6] hover:text-[#7ff0cc] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Title block */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-5xl font-bold font-heading text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/50">
            {post.author?.name && (
              <span className="inline-flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-xs">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-white/80 font-medium">{post.author.name}</span>
                  <span className="text-[11px] text-white/40">Author</span>
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {rtime} min read
            </span>
          </div>

          {/* Share */}
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-white/40">
              <Share2 className="w-3.5 h-3.5" /> Share
            </span>
            <button
              onClick={copyLink}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1",
                copied
                  ? "bg-[#5CE3B6]/20 border-[#5CE3B6]/40 text-[#5CE3B6]"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </motion.div>

        {/* Cover */}
        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 rounded-2xl overflow-hidden border border-white/10"
          >
            <img src={post.coverImage} alt={post.title} className="w-full h-64 sm:h-80 object-cover" />
          </motion.div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                className="inline-flex items-center gap-1 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/50 hover:text-white hover:border-white/30 transition"
              >
                <Tag className="w-3 h-3" /> {t}
              </Link>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <RichTextRenderer content={post.content} />
        </div>

        {/* Footer author card */}
        {post.author?.name && (
          <div className="mt-12 glass rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3352CD] to-[#5CE3B6] flex items-center justify-center text-white font-bold text-lg">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white font-heading">{post.author.name}</p>
              <p className="text-sm text-white/50">Ganesha Students Innovation Center</p>
            </div>
            <Link href="/blog" className="text-sm text-[#5CE3B6] hover:text-[#7ff0cc] transition font-medium">
              More articles
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}