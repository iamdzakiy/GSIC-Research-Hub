import { describe, expect, it } from "vitest";
import { renderArticle } from "@/lib/render-content";

describe("renderArticle", () => {
  it("turns an image with a title into a figure with caption, size and lazy loading", () => {
    const { html } = renderArticle('![Peta alur](/blog/pkm-bootcamp/00-alur-bootcamp.svg "Contoh ilustrasi")');
    expect(html).toContain('<figure class="fig">');
    expect(html).toContain('src="/blog/pkm-bootcamp/00-alur-bootcamp.svg"');
    expect(html).toContain('width="1200" height="675"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("<figcaption>Contoh ilustrasi</figcaption>");
  });
  it("renders callouts with Indonesian titles when lang is id", () => {
    const { html } = renderArticle("> [!TIP]\n> Mulai dari yang kecil.\n\n> [!WARNING]\n> Jangan menunggu tenggat.", { lang: "id" });
    expect(html).toMatch(/<aside class="callout callout-tip"><p class="callout-title">Tips<\/p><p>Mulai dari yang kecil\.<\/p>\s*<\/aside>/);
    expect(html).toContain("callout-warning");
    expect(html).toContain("Peringatan");
  });
  it("keeps a plain blockquote as a blockquote", () => {
    expect(renderArticle("> kutipan").html).toContain("<blockquote>");
  });
  it("renders task lists with numbered items and no form controls", () => {
    const { html } = renderArticle("- [ ] satu\n- [x] dua\n- tiga");
    expect(html).toContain('class="task-list"');
    expect(html).toContain('data-task="1"');
    expect(html).toContain('data-task="2"');
    expect(html).not.toContain("<input");
  });
  it("wraps tables for horizontal scrolling", () => {
    const { html } = renderArticle("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toMatch(/<div class="table-wrap"><table>/);
  });
  it("gives h2/h3 ids, a copy-link anchor and a table of contents with unique ids", () => {
    const { html, toc } = renderArticle("## Langkah 1: pilih\n\ntext\n\n### Rincian\n\n## Langkah 1: pilih");
    expect(toc.map((t) => t.id)).toEqual(["langkah-1-pilih", "rincian", "langkah-1-pilih-2"]);
    expect(html).toContain('<h2 id="langkah-1-pilih">');
    expect(html).toContain('class="h-anchor" href="#langkah-1-pilih"');
  });
  it("keeps internal links and images but strips scripts, handlers, inline styles and inputs", () => {
    const { html } = renderArticle('[ke seri](/blog/pkm-memilih-skema-re-kc-gft-k) <script>alert(1)</script> <img src=x onerror="alert(1)"> <input type=checkbox> <a href="javascript:alert(1)">x</a> <p style="color:red">y</p>');
    expect(html).toContain('href="/blog/pkm-memilih-skema-re-kc-gft-k"');
    expect(html).not.toMatch(/<script|onerror|<input|javascript:|style=/);
  });
  it("sanitises HTML content with the same allow-list and returns no ToC", () => {
    const { html, toc } = renderArticle('<h2 id="x" onclick="a()">Judul</h2><p>ok</p><script>1</script>');
    expect(toc).toEqual([]);
    expect(html).toContain('<h2 id="x">Judul</h2>');
    expect(html).not.toContain("script");
  });
});
