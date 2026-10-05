import { ArrowUpRight } from "lucide-react";
import TagBadge from "@/components/portal/TagBadge";
import CopyLinkButton from "@/components/portal/CopyLinkButton";

interface Props { link: { id: string; title: string; url: string; description: string | null; tags: string[]; isFeatured: boolean }; host: string }

export default function LinkCard({ link, host }: Props) {
  return (
    <article className="group relative flex gap-3.5 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold uppercase text-slate-400" aria-hidden="true">
        {host.charAt(0)}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" width={24} height={24} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 m-auto h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-start gap-1 text-sm font-semibold leading-snug text-slate-900">
          <a href={link.url} target="_blank" rel="noopener noreferrer nofollow" className="after:absolute after:inset-0 group-hover:text-brand-700 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand-600">
            {link.title}
          </a>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-brand-700" aria-hidden="true" />
        </h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">{host}</p>
        {link.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{link.description}</p>}
        {link.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">{link.tags.slice(0, 3).map((t) => <TagBadge key={t} tag={t} className="px-1.5 py-0.5 text-[11px]" />)}</div>
        )}
      </div>
      <CopyLinkButton url={link.url} label={link.title} />
    </article>
  );
}
