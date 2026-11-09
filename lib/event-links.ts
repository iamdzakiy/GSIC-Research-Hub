// Canonical event URLs and date text. Events without a slug (old rows) fall back to the program's main page.
export const eventHref = (e: { slug?: string | null; type: string }) =>
  `/events/${e.slug || (e.type === "sandbox" ? "sandbox-sesi-1" : "pkm-bootcamp-2027")}`;

const fmt = (d: Date | string, opts: Intl.DateTimeFormatOptions) => new Date(d).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", ...opts });

export const SERIES = ["GSIC PKM Bootcamp", "The Sandbox Series"] as const;
export const seriesOf = (e: { series?: string | null; type: string }) => e.series || (e.type === "bootcamp" ? SERIES[0] : SERIES[1]);

/** Coming-soon events and TBA dates show a label; otherwise a readable Indonesian date (range when it spans days). */
export function eventWhen(e: { comingSoon?: boolean; dateLabel?: string | null; startDate: Date | string | null; endDate: Date | string | null }): string {
  if (e.comingSoon) return "Segera hadir";
  if (e.dateLabel) return e.dateLabel;
  if (!e.startDate || !e.endDate) return "Tanggal menyusul";
  const s = fmt(e.startDate, { day: "numeric", month: "long", year: "numeric" });
  const same = fmt(e.startDate, { dateStyle: "short" }) === fmt(e.endDate, { dateStyle: "short" });
  return same ? s : `${s} – ${fmt(e.endDate, { day: "numeric", month: "long", year: "numeric" })}`;
}

export const eventTime = (d: Date | string) => new Date(d).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".");
