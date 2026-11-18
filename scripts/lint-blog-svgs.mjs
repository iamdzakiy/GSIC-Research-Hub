// Fails when a blog SVG uses a colour that is not a brand token, lacks <title>/<desc>/viewBox, or has text under 22px.
// Run: node scripts/lint-blog-svgs.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "public/blog/pkm-bootcamp";
const tokens = readFileSync("app/tokens.css", "utf8");
const allowed = new Set(["#FFFFFF"]);
for (const m of tokens.matchAll(/--[\w-]+:\s*(\d+) (\d+) (\d+);/g)) {
  allowed.add("#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase());
}
let bad = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".svg"))) {
  const s = readFileSync(join(dir, f), "utf8");
  const errs = [];
  for (const h of new Set(s.match(/#[0-9A-Fa-f]{6}\b/g) ?? [])) if (!allowed.has(h.toUpperCase())) errs.push(`stray colour ${h}`);
  if (!/<title>/.test(s) || !/<desc>/.test(s)) errs.push("missing title or desc");
  const vb = s.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!vb) errs.push("missing viewBox");
  else if (f.startsWith("cover-") ? vb[1] + "x" + vb[2] !== "1600x900" : vb[1] + "x" + vb[2] !== "1200x675") errs.push(`unexpected size ${vb[1]}x${vb[2]}`);
  for (const m of s.matchAll(/font-size="(\d+(?:\.\d+)?)"/g)) if (Number(m[1]) < 22) errs.push(`font-size ${m[1]} < 22`);
  if (errs.length) { bad++; console.log(f, [...new Set(errs)].join("; ")); }
}
console.log(bad ? `${bad} file(s) with problems` : "all SVGs clean");
process.exit(bad ? 1 : 0);
