// Registration confirmation e-mail (Indonesian, the community's language) with an .ics when the date is exact.
import "server-only";
import { renderEmail } from "@/lib/email-templates";
import { trySendMail } from "@/lib/mailer";
import { buildEventIcs } from "@/lib/ics";
import { eventHref, eventTime, eventWhen } from "@/lib/event-links";

const MODE: Record<string, string> = { online: "Daring", onsite: "Tatap muka", hybrid: "Hibrida" };

interface EventLike { id: string; slug: string | null; type: string; title: string; description: string; startDate: Date; endDate: Date; dateLabel: string | null; location: string; mode: string }

export async function sendRegistrationEmail(user: { email: string; name: string | null }, e: EventLike, site: string) {
  const exact = !e.dateLabel;
  const url = `${site}${eventHref(e)}`;
  const first = user.name?.trim().split(/\s+/)[0] || "";
  const mail = renderEmail({
    subject: `Pendaftaran terkonfirmasi: ${e.title}`,
    preheader: "Anda sudah terdaftar. Berikut detail acaranya.",
    title: "Pendaftaran Anda terkonfirmasi",
    body: `Halo${first ? ` ${first}` : ""}, Anda sudah terdaftar di ${e.title}. ${exact ? "Undangan kalender terlampir." : "Tanggal pasti masih menyusul. Kami akan mengabari Anda, dan acara ini akan muncul di dasbor Anda."}`,
    facts: [
      ["Waktu", exact ? `${eventWhen(e)}, ${eventTime(e.startDate)}–${eventTime(e.endDate)} WIB` : e.dateLabel!],
      ["Tempat", e.location],
      ["Format", MODE[e.mode] ?? e.mode],
    ],
    cta: "Buka halaman acara",
    url,
    note: e.mode === "online" ? "Tautan Zoom hanya terlihat di halaman acara setelah Anda masuk." : undefined,
  }, site);
  await trySendMail({
    to: user.email,
    ...mail,
    attachments: exact
      ? [{ filename: "acara-gsic.ics", contentType: "text/calendar; charset=utf-8; method=PUBLISH", content: buildEventIcs({ id: e.id, title: e.title, start: e.startDate, end: e.endDate, location: e.location, description: e.title, url }) }]
      : undefined,
  });
}
