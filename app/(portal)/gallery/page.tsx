import type { Metadata } from "next";
import PageHero from "@/components/hub/PageHero";
import { prisma } from "@/lib/prisma";
import GalleryGrid from "@/components/portal/GalleryGrid";

export const metadata: Metadata = { title: "Gallery · GSIC Hub", description: "Photos from GSIC bootcamps, sandboxes and community events." };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({ where: { isPublished: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <PageHero compact kicker="Gallery" title={<>Moments from <span className="outline-cream">GSIC events</span></>}>Bootcamps, sandboxes and community days. Select a photo to enlarge it.</PageHero>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mt-8">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No photos yet. Admins can add them under Admin, Gallery.</p>
        ) : (
          <GalleryGrid items={items.map((g) => ({ id: g.id, title: g.title, caption: g.caption, imageUrl: g.imageUrl, eventLabel: g.eventLabel }))} />
        )}
      </div>
    </main>
    </>
  );
}
