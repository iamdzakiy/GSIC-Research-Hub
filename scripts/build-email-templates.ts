/** Regenerates docs/supabase-email-templates/*.html from lib/email-templates.ts.  usage: npx tsx scripts/build-email-templates.ts */
import { mkdirSync, writeFileSync } from "node:fs";
import { renderActionEmail, type EmailKind } from "../lib/email-templates";

const OUT = "docs/supabase-email-templates";
const FILES: [EmailKind, string, string][] = [
  ["verify", "confirm-signup.html", "Confirm signup"],
  ["magic", "magic-link.html", "Magic link"],
  ["reset", "reset-password.html", "Reset password"],
];
mkdirSync(OUT, { recursive: true });
for (const [kind, file] of FILES) {
  const { html } = renderActionEmail(kind, { url: "{{ .ConfirmationURL }}", siteUrl: "{{ .SiteURL }}" });
  writeFileSync(`${OUT}/${file}`, html);
}
console.log("written:", FILES.map((f) => f[1]).join(", "));
