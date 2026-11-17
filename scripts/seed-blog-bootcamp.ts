/**
 * Seeds the PKM Bootcamp article series from docs/hub-v3/blog/*.md. Idempotent: upserts by slug.
 *   npx tsx scripts/seed-blog-bootcamp.ts [--force] [--dry-run]
 * - Files are parsed with gray-matter. Front matter: slug, title, excerpt, tags, series, seriesOrder, cover.
 * - Posts are Indonesian (lang "id"), published, authored by the first admin.
 * - A post an admin edited since the last seed is left alone (its fields no longer match the stored hash),
 *   and so is one that already existed without being seeded. Pass --force to overwrite those.
 * - The figures listed in the front matter must exist in public/blog/pkm-bootcamp/. A missing file is reported.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");
const DIR = join(process.cwd(), "docs/hub-v3/blog");

interface Seeded { title: string; excerpt: string | null; content: string; tags: string[]; coverImage: string | null; series: string | null; seriesOrder: number | null }
export const hashOf = (p: Seeded): string => createHash("sha256").update(JSON.stringify([p.title, p.excerpt ?? "", p.content, p.tags, p.coverImage ?? "", p.series ?? "", p.seriesOrder ?? null])).digest("hex");

function load(file: string): { slug: string; data: Seeded; missing: string[] } {
  const parsed = matter(readFileSync(join(DIR, file), "utf8"));
  const fm = parsed.data as Record<string, unknown>;
  const need = (k: string) => { if (fm[k] === undefined || fm[k] === null || fm[k] === "") throw new Error(`${file}: front matter is missing "${k}"`); return fm[k]; };
  const figures = Array.isArray(fm.figures) ? (fm.figures as { file: string }[]).map((f) => f.file) : [];
  const files = [...figures, ...(typeof fm.cover === "string" ? [String(fm.cover).split("/").pop()!] : [])];
  const missing = files.filter((f) => !existsSync(join(process.cwd(), "public/blog/pkm-bootcamp", f)));
  return {
    slug: String(need("slug")),
    missing,
    data: {
      title: String(need("title")), excerpt: fm.excerpt ? String(fm.excerpt) : null, content: parsed.content.trim() + "\n",
      tags: Array.isArray(fm.tags) ? (fm.tags as unknown[]).map(String) : [], coverImage: fm.cover ? String(fm.cover) : null,
      series: fm.series ? String(fm.series) : null, seriesOrder: typeof fm.seriesOrder === "number" ? fm.seriesOrder : null,
    },
  };
}

async function main() {
  const author = await prisma.user.findFirst({ where: { role: "admin" }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!author) throw new Error("No admin user found. Create one first, then run this again.");
  const files = readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();
  const out = { created: [] as string[], updated: [] as string[], unchanged: [] as string[], skipped: [] as string[], missing: [] as string[] };
  for (const file of files) {
    const { slug, data, missing } = load(file);
    for (const m of missing) out.missing.push(`${slug}: ${m}`);
    const hash = hashOf(data);
    const cur = await prisma.blogPost.findUnique({ where: { slug } });
    if (!cur) {
      if (!DRY) await prisma.blogPost.create({ data: { ...data, slug, lang: "id", status: "published", publishedAt: new Date(), authorId: author.id, seedHash: hash } });
      out.created.push(slug); continue;
    }
    const currentHash = hashOf({ title: cur.title, excerpt: cur.excerpt, content: cur.content, tags: cur.tags, coverImage: cur.coverImage, series: cur.series, seriesOrder: cur.seriesOrder });
    if (cur.seedHash === hash && currentHash === hash && cur.lang === "id") { out.unchanged.push(slug); continue; }
    const editedByAdmin = !cur.seedHash || currentHash !== cur.seedHash;
    if (editedByAdmin && !FORCE) { out.skipped.push(slug); continue; }
    if (!DRY) await prisma.blogPost.update({ where: { slug }, data: { ...data, lang: "id", status: "published", publishedAt: cur.publishedAt ?? new Date(), seedHash: hash } });
    out.updated.push(slug);
  }
  console.log(`${DRY ? "[dry run] " : ""}created ${out.created.length}, updated ${out.updated.length}, unchanged ${out.unchanged.length}, skipped ${out.skipped.length}`);
  if (out.skipped.length) console.log(`Skipped (edited since the last seed, or not seeded by this script; use --force to overwrite):\n  ${out.skipped.join("\n  ")}`);
  if (out.missing.length) console.log(`Missing image files:\n  ${out.missing.join("\n  ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
