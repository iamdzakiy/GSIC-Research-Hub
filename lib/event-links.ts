// Canonical event URLs and date text. Events without a slug (old rows) fall back to the program's main page.
export const eventHref = (e: { slug?: string | null; type: string }) =>
  `/events/${e.slug || (e.type === "sandbox" ? "sandbox-sesi-1" : "pkm-bootcamp-2027")}`;

const fmt = (d: Date | string, opts: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", ...opts });

/** `dateLabel` wins while dates are TBA; otherwise a readable Indonesian date (range when it spans days). */
export function eventWhen(e: { dateLabel?: string | null; startDate: Date | string; endDate: Date | string }): string {
  if (e.dateLabel) return e.dateLabel;
  const s = fmt(e.startDate, { day: "numeric", month: "long", year: "numeric" });
  const same = fmt(e.startDate, { dateStyle: "short" }) === fmt(e.endDate, { dateStyle: "short" });
  return same ? s : `${s} – ${fmt(e.endDate, { day: "numeric", month: "long", year: "numeric" })}`;
}

export const eventTime = (d: Date | string) => new Date(d).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".");
