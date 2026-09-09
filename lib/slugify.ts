// ============================================================
// Robust URL slug generator
// ============================================================

/**
 * Converts an arbitrary string into a URL-safe, lowercase, dash-separated slug.
 * Handles Latin accents/ligatures, trims punctuation, collapses whitespace and
 * multiple dashes, and enforces a maximum length.
 */
export function slugify(input: string): string {
  if (!input) return "";

  return String(input)
    .normalize("NFKD")
    // Remove combining diacritical marks (e.g. é -> e).
    .replace(/[\u0300-\u036f]/g, "")
    // Transliterate common Latin ligatures / special chars.
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l")
    .replace(/ñ/g, "n")
    .replace(/ç/g, "c")
    .replace(/&/g, " and ")
    // Lowercase.
    .toLowerCase()
    // Replace any non-alphanumeric sequence with a single dash.
    .replace(/[^a-z0-9]+/g, "-")
    // Trim leading/trailing dashes.
    .replace(/^-+|-+$/g, "")
    // Collapse any remaining runs of dashes.
    .replace(/-{2,}/g, "-")
    // Cap length.
    .slice(0, 80);
}

/**
 * Guarantees a globally-unique slug by appending a short random suffix when the
 * generated slug is empty or collides with an existing one.
 */
export function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const clean = slugify(base) || "untitled";
  // First check the clean slug directly.
  return isTaken(clean).then(async (taken) => {
    if (!taken) return clean;
    for (let i = 1; i < 100; i++) {
      const candidate = `${clean}-${i}`;
      if (!(await isTaken(candidate))) return candidate;
    }
    // Extremely unlikely fallback with random suffix.
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${clean}-${suffix}`;
  });
}