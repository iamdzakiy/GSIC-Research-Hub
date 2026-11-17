"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TocItem } from "@/lib/render-content";

/** "On this page". Sticky list on desktop, collapsible on mobile. Highlights the section being read. */
export default function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);
  if (items.length < 2) return null;

  const list = (
    <ol className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.id} className={i.level === 3 ? "pl-4" : ""}>
          <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined}
            className={`block rounded-md px-2 py-1 leading-snug transition-colors ${active === i.id ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            {i.text}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <details className="group print:hidden rounded-xl border border-slate-200 bg-white lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 text-sm font-semibold text-slate-800">
          On this page
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <nav aria-label="Table of contents" lang="id" className="border-t border-slate-200 p-3">{list}</nav>
      </details>
      <nav aria-label="Table of contents" lang="id" className="print:hidden sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
        <p className="label-mono mb-2 px-2 text-slate-500">On this page</p>
        {list}
      </nav>
    </>
  );
}
