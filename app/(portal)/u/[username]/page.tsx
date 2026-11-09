import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PARTNER_SELECT, liveWhere } from "@/lib/partners";
import { categoryLabel } from "@/lib/competitions";
import { PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import Avatar from "@/components/hub/Avatar";
import PartnerCard from "@/components/hub/PartnerCard";

export const dynamic = "force-dynamic";
type Props = { params: { username: string } };

/** Public card for members who chose to be listed. No email or WhatsApp here, ever. */
const find = (username: string) => prisma.user.findFirst({
  where: { username: username.toLowerCase(), directoryVisible: true, deletedAt: null },
  select: { id: true, name: true, avatarUrl: true, headline: true, major: true, faculty: true, year: true, bio: true, preferredRole: true, competitionInterests: true, skills: true, openToTeam: true, linkedinUrl: true, portfolioUrl: true, githubUrl: true, achievements: true },
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const u = await find(params.username).catch(() => null);
  return u ? { title: `${u.name} · GSIC Hub`, description: u.headline || `${u.major ?? "ITB"} student on GSIC Hub`, robots: { index: false } } : { title: "Member not found · GSIC Hub" };
}

export default async function MemberPage({ params }: Props) {
  const u = await find(params.username).catch(() => null);
  if (!u) notFound();
  const posts = await prisma.teamCall.findMany({ where: { ...liveWhere(), ownerId: u.id }, select: PARTNER_SELECT, orderBy: { createdAt: "desc" }, take: 6 }).catch(() => []);
  const ach = (Array.isArray(u.achievements) ? u.achievements : []) as { title: string; year?: number; result?: string }[];
  const links = [["LinkedIn", u.linkedinUrl], ["Portfolio", u.portfolioUrl], ["GitHub", u.githubUrl]].filter(([, v]) => v) as [string, string][];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={u.name} src={u.avatarUrl} size={96} className="ring-4 ring-brand-100" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{u.name}</h1>
          <p className="mt-1 text-ink-2">{u.headline || [u.major, u.faculty, u.year && `'${String(u.year).slice(-2)}`].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {u.openToTeam && <span className="label-mono rounded bg-mint-100 px-1.5 py-0.5 text-navy">Open to a team</span>}
            {u.preferredRole && <span className="label-mono rounded bg-brand-50 px-1.5 py-0.5 text-brand-800">{labelOf(PREFERRED_ROLES, u.preferredRole)}</span>}
          </div>
        </div>
      </header>
      {links.length > 0 && <p className="mt-5 flex flex-wrap gap-4 text-sm">{links.map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">{l}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>)}</p>}
      {u.bio && <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-ink-2">{u.bio}</p>}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {u.competitionInterests.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="label-mono text-ink-3">Wants to join</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">{u.competitionInterests.map((c) => <li key={c}><Link href={`/competitions?cat=${c}`} className="rounded-md bg-paper-2 px-2 py-1 text-xs font-medium text-ink-2 hover:text-ink">{categoryLabel(c)}</Link></li>)}</ul>
          </section>
        )}
        {u.skills.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="label-mono text-ink-3">Skills</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">{u.skills.map((s) => <li key={s} className="rounded-md bg-paper-2 px-2 py-1 text-xs text-ink-2">{s}</li>)}</ul>
          </section>
        )}
      </div>
      {ach.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="label-mono text-ink-3">Achievements</h2>
          <ul className="mt-3 divide-y divide-slate-100">{ach.map((a, i) => <li key={i} className="flex justify-between gap-4 py-2.5 text-sm"><span className="font-medium text-ink">{a.title}</span><span className="tnum text-ink-3">{[a.result, a.year].filter(Boolean).join(" · ")}</span></li>)}</ul>
        </section>
      )}
      {posts.length > 0 && (
        <section className="mt-10"><h2 className="font-display text-xl font-semibold text-ink">Open partner posts</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">{posts.map((p) => <li key={p.id}><PartnerCard p={p} compact /></li>)}</ul>
        </section>
      )}
    </main>
  );
}
