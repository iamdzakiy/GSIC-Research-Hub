// ============================================================
// Blog post service (client-side API access)
// ============================================================
import { BlogPost } from "@/lib/types";
import { apiFetch, extractError } from "@/lib/apiFetch";

export interface BlogListResult {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getBlogPosts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  status?: string;
}): Promise<BlogListResult> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.search) qs.set("search", params.search);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.status) qs.set("status", params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/blog${suffix}`);
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  const data = await res.json();
  return {
    posts: Array.isArray(data) ? data : (data.posts || []),
    total: data.total ?? data.posts?.length ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 20,
  };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch blog post");
  }
  return res.json();
}

export interface CreateBlogInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  slug?: string;
  status?: "draft" | "published";
  tags?: string[];
  publishedAt?: string;
}

export async function createBlogPost(data: CreateBlogInput): Promise<BlogPost> {
  const res = await apiFetch("/api/blog", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateBlogPost(id: string, data: Partial<CreateBlogInput>): Promise<BlogPost> {
  const res = await apiFetch(`/api/blog/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await apiFetch(`/api/blog/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await extractError(res));
}