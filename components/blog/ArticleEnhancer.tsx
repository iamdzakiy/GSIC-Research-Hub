"use client";
import { useEffect, useState } from "react";
import { readKey, readSlugs } from "@/components/blog/SeriesPanel";

/**
 * Progressive enhancement for the server-rendered article body (#article-body):
 * tickable checklists remembered per article, a lightbox for figures, copy-link on headings,
 * and "read" ticks for the series panel. Everything works read-only without JavaScript.
 */
export default function ArticleEnhancer({ slug, series }: { slug: string; series?: string | null }) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    const body = document.getElementById("article-body");
    if (!body) return;
    const cleanups: (() => void)[] = [];

    // 1. Checklists
    const tkey = `gsic:tasks:${slug}`;
    let done: number[] = [];
    try { const v = JSON.parse(localStorage.getItem(tkey) ?? "[]"); if (Array.isArray(v)) done = v.filter((n): n is number => typeof n === "number"); } catch { /* private mode */ }
    const save = () => { try { localStorage.setItem(tkey, JSON.stringify(done)); } catch { /* ignore */ } };
    body.querySelectorAll<HTMLElement>("li.task").forEach((li) => {
      const n = Number(li.dataset.task);
      const paint = () => { const on = done.includes(n); li.classList.toggle("is-done", on); li.setAttribute("aria-checked", String(on)); };
      li.setAttribute("role", "checkbox"); li.tabIndex = 0; paint();
      const toggle = () => { done = done.includes(n) ? done.filter((x) => x !== n) : [...done, n]; save(); paint(); };
      const onKey = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } };
      li.addEventListener("click", toggle); li.addEventListener("keydown", onKey);
      cleanups.push(() => { li.removeEventListener("click", toggle); li.removeEventListener("keydown", onKey); });
    });

    // 2. Copy link on headings
    const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2000); };
    const onAnchor = async (e: Event) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a.h-anchor");
      if (!a) return;
      e.preventDefault();
      const url = `${window.location.origin}${window.location.pathname}${a.getAttribute("href")}`;
      history.replaceState(null, "", a.getAttribute("href")!);
      document.getElementById(a.getAttribute("href")!.slice(1))?.scrollIntoView({ block: "start" });
      try { await navigator.clipboard.writeText(url); flash("Link copied"); } catch { flash("Link is in the address bar"); }
    };
    body.addEventListener("click", onAnchor);
    cleanups.push(() => body.removeEventListener("click", onAnchor));

    // 3. Lightbox
    const onImg = (e: Event) => {
      const img = (e.target as HTMLElement).closest<HTMLImageElement>("figure.fig img");
      if (!img) return;
      const opener = document.activeElement as HTMLElement | null;
      const wrap = document.createElement("div");
      wrap.className = "lightbox"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-label", img.alt || "Figure");
      const big = document.createElement("img"); big.src = img.currentSrc || img.src; big.alt = img.alt;
      const cap = img.closest("figure")?.querySelector("figcaption")?.textContent;
      const close = document.createElement("button"); close.type = "button"; close.className = "lightbox-close"; close.textContent = "Close"; close.setAttribute("aria-label", "Close figure");
      wrap.append(big); if (cap) { const p = document.createElement("p"); p.textContent = cap; wrap.append(p); } wrap.append(close);
      const shut = () => { wrap.remove(); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; opener?.focus?.(); };
      const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") shut(); if (ev.key === "Tab") { ev.preventDefault(); close.focus(); } };
      wrap.addEventListener("click", (ev) => { if (ev.target !== big) shut(); });
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden"; document.body.append(wrap); close.focus();
    };
    body.addEventListener("click", onImg);
    cleanups.push(() => body.removeEventListener("click", onImg));
    body.querySelectorAll<HTMLImageElement>("figure.fig img").forEach((i) => { i.style.cursor = "zoom-in"; });

    // 4. Mark as read when the end of the article is reached
    const end = document.getElementById("article-end");
    if (end && series) {
      const io = new IntersectionObserver((es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        const cur = readSlugs(series);
        if (!cur.includes(slug)) { try { localStorage.setItem(readKey(series), JSON.stringify([...cur, slug])); } catch { /* ignore */ } window.dispatchEvent(new CustomEvent("series-read", { detail: series })); }
        io.disconnect();
      }, { threshold: 0.1 });
      io.observe(end);
      cleanups.push(() => io.disconnect());
    }
    return () => cleanups.forEach((c) => c());
  }, [slug, series]);

  return <div className="sr-only" role="status" aria-live="polite">{toast}</div>;
}
