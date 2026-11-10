import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { COMPETITION_CATEGORIES, categoryShort } from "@/lib/competitions";
import { PREFERRED_ROLES, labelOf } from "@/lib/profile-options";
import Avatar from "@/components/hub/Avatar";
import PageHero from "@/components/hub/PageHero";
import Blank from "@/components/hub/Blank";
import { btnSecondary, chip, input } from "@/components/hub/buttons";

export const metadata: Metadata = { title: "Members · GSIC Hub", description: "Find teammates by skill, role and the competitions they want to join." };
export const dynamic = "force-dynamic";

type SP = { q?: string; role?: string; cat?: string; open?: string };
const PAGE = 24;

/** Public member directory for match-making. Shows only members who chose to be listed, and never their email or WhatsApp. */
export default async function MembersPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams.q ?? "").trim().slice(0, 60);
  const role = PREFERRED_ROLES.some((r) => r.id === searchParams.role) ? searchParams.role : undefined;
  const cat = COMPETITION_CATEGORIES.some((c) => c.id === searchParams.cat) ? searchParams.cat : undefined;
  const open = searchParams.open === "1";

  const where: Prisma.UserWhereInput = {
    deletedAt: null, directoryVisible: true, username: { not: null },
    ...(open ? { openToTeam: true } : {}),
    ...(role ? { preferredRole: role } : {}),
    ...(cat ? { competitionInterests: { has: cat } } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" } },
      { headline: { contains: q, mode: "insensitive" } },
      { major: { contains: q, mode: "insensitive" } },
      { skills: { has: q } }, { skills: { has: q.toLowerCase() } }, { skills: { has: q.toUpperCase() } },
      { softSkills: { has: q } },
    ] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: [{ openToTeam: "desc" }, { updatedAt: "desc" }], take: PAGE,
      select: { id: true, username: true, name: true, avatarUrl: true, headline: true, major: true, faculty: true, year: true, preferredRole: true, skills: true, competitionInterests: true, openToTeam: true } }).catch(() => []),
    prisma.user.count({ where }).catch(() => 0),
  ]);

  const href = (o: Partial<SP>) => {
    const n = { q, role, cat, open: open ? "1" : undefined, ...o } as Record<string, string | undefined>;
    const s = new URLSearchParams(Object.entries(n).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `/members?${s}` : "/members";
  };

  return (
    <>
      <PageHero compact kicker="Members" title={<>Find your <span className="outline-cream">teammates</span></>}>
        Search by skill, role or the competition someone wants to join. Contacts stay private until you team up through a Seeking Partner post.
      </PageHero>
      <div className="border-b border-slate-200 bg-paper">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 lg:px-8">
          <form action="/members" role="search" className="flex max-w-xl gap-2">
            {role && <input type="hidden" name="role" value={role} />}
            {cat && <input type="hidden" name="cat" value={cat} />}
            {open && <input type="hidden" name="open" value="1" />}
            <label className="relative flex-1">
              <span className="sr-only">Search members</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input name="q" defaultValue={q} placeholder="Skill, name or major, e.g. Python" className={`${input()} pl-9`} />
            </label>
            <button className={btnSecondary}>Search</button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filters">
            <Link href={href({ open: open ? undefined : "1" })} className={chip(open)}>Open to a team</Link>
            <span className="mx-1 hidden h-5 w-px bg-slate-300 sm:block" aria-hidden="true" />
            {PREFERRED_ROLES.map((r) => <Link key={r.id} href={href({ role: role === r.id ? undefined : r.id })} className={chip(role === r.id)}>{r.label}</Link>)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {COMPETITION_CATEGORIES.filter((c) => c.id !== "other").map((c) => <Link key={c.id} href={href({ cat: cat === c.id ? undefined : c.id })} className={chip(cat === c.id)} title={c.label}>{c.short}</Link>)}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-live="polite">
        <p className="mb-4 text-sm text-ink-3"><span className="tnum font-semibold text-ink">{total}</span> {total === 1 ? "member" : "members"}{(q || role || cat || open) && <> · <Link href="/members" className="font-medium text-brand-700 underline">Clear</Link></>}</p>
        {items.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((u) => (
              <li key={u.id}>
                <article className="lift relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size={44} />
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-[16px] font-semibold text-ink"><Link href={`/u/${u.username}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">{u.name}</Link></h2>
                      <p className="truncate text-xs text-ink-3">{[u.major, u.faculty, u.year && `'${String(u.year).slice(-2)}`].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  {u.headline && <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-2">{u.headline}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {u.openToTeam && <span className="label-mono rounded bg-mint-100 px-1.5 py-0.5 text-navy">Open to a team</span>}
                    {u.preferredRole && <span className="label-mono rounded bg-brand-50 px-1.5 py-0.5 text-brand-800">{labelOf(PREFERRED_ROLES, u.preferredRole)}</span>}
                  </div>
                  {u.skills.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{u.skills.slice(0, 5).map((s) => <li key={s} className="rounded-md bg-paper-2 px-2 py-0.5 text-xs text-ink-2">{s}</li>)}{u.skills.length > 5 && <li className="px-1 py-0.5 text-xs text-ink-3">+{u.skills.length - 5}</li>}</ul>}
                  <div className="min-h-3 flex-1" />
                  {u.competitionInterests.length > 0 && <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-ink-3">Wants to join: {u.competitionInterests.slice(0, 4).map(categoryShort).join(", ")}</p>}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Blank title="No members match these filters" hint="Try a different skill or clear the filters. Members appear here after they turn on “Show me in the member directory” in Settings.">
            <Link href="/members" className={btnSecondary}>Clear filters</Link>
          </Blank>
        )}
      </section>
    </>
  );
}
