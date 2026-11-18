import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const alt = "GSIC Hub article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image: the article cover (rasterised) with the title and series label over the lower third. */
export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug).catch(() => null);
  let cover: string | null = null;
  if (post?.coverImage && /^\/blog\/[\w./-]+\.svg$/.test(post.coverImage) && !post.coverImage.includes("..")) {
    try { cover = `data:image/svg+xml;base64,${readFileSync(path.join(process.cwd(), "public", post.coverImage)).toString("base64")}`; } catch { cover = null; }
  }
  const title = post?.title ?? "GSIC Hub";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0B1120", color: "#fff", fontFamily: "sans-serif" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1120} height={630} style={{ position: "absolute", top: 0, right: 0, width: 1120, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", padding: "72px 56px 44px", background: "linear-gradient(to top, rgba(11,17,32,1) 55%, rgba(11,17,32,0))" }}>
          {post?.series && <div style={{ fontSize: 26, fontWeight: 700, color: "#5CE3B6", letterSpacing: 1, textTransform: "uppercase" }}>{post.series}</div>}
          <div style={{ marginTop: 10, fontSize: title.length > 60 ? 44 : 54, fontWeight: 800, lineHeight: 1.12 }}>{title}</div>
          <div style={{ marginTop: 18, fontSize: 24, color: "#BDCBF5" }}>GSIC Hub</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
