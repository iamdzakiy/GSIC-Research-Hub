/** A malformed NEXT_PUBLIC_SITE_URL (e.g. missing "https://") must never take the whole site down at module load. */
export function siteBase(): URL {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  for (const candidate of [raw, raw && `https://${raw}`, "http://localhost:3000"]) {
    try { if (candidate) return new URL(candidate); } catch { /* try next */ }
  }
  return new URL("http://localhost:3000");
}
