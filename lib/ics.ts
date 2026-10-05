// Minimal RFC 5545 all-day event generator (deadline reminder).
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (d: Date, tz = "Asia/Jakarta") => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return p.replace(/-/g, "");
};
/** RFC lines must be ≤75 octets; fold long ones. */
const fold = (line: string) => (line.length <= 73 ? line : line.match(/.{1,73}/g)!.join("\r\n "));

export function buildDeadlineIcs(o: { id: string; title: string; organizer: string; deadline: Date; url: string }): string {
  const day = ymd(o.deadline);
  const next = new Date(o.deadline.getTime() + 86_400_000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GSIC Hub//Opportunities//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${o.id}@gsic-hub`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${ymd(next)}`,
    fold(`SUMMARY:${esc(`Deadline: ${o.title}`)}`),
    fold(`DESCRIPTION:${esc(`${o.organizer}\n${o.url}`)}`),
    fold(`URL:${o.url}`),
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:Deadline in 3 days", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
