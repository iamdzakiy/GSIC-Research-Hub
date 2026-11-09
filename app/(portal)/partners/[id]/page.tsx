import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { getPartnerPost } from "@/lib/partners";
import { categoryLabel, closesLabel, wibDateLong } from "@/lib/competitions";
import { KIND_LABEL, roleText } from "@/lib/partner-labels";
import Avatar from "@/components/hub/Avatar";
import Countdown from "@/components/hub/Countdown";
import ShareWhatsApp from "@/components/hub/ShareWhatsApp";
import PartnerActions from "@/components/partners/PartnerActions";

export const dynamic = "force-dynamic";
type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPartnerPost(params.id).catch(() => null);
  if (!p) return { title: "Post not found · GSIC Hub" };
  const desc = `${KIND_LABEL[p.kind]} for ${p.opportunity?.title ?? p.competition}: ${p.rolesNeeded.map(roleText).join(", ")}.`;
  return { title: `${p.title} · Seeking Partner · GSIC Hub`, description: desc, openGraph: { title: p.title, description: desc } };
}

export default async function PartnerPostPage({ params }: Props) {
  const p = await getPartnerPost(params.id).catch(() => null);
  if (!p) notFound();
  const lft = p.kind === "looking_for_team";
  const open = p.status === "open" && !closesLabel(p.deadline).closed;
  const compName = p.opportunity?.title ?? p.event?.title ?? p.competition;
  const share = `${lft ? "Looking for a team" : `Seeking partner (${p.rolesNeeded.map(roleText).join(", ")})`} for ${compName}: ${p.title}`;

  const facts: [string, React.ReactNode][] = [
    ["Respond by", <Countdown key="c" deadline={p.deadline} />],
    ...(p.category ? [["Category", categoryLabel(p.category)] as [string, string]] : []),
    ...(!lft ? [["Open slots", `${p.slots}${p.currentTeamSize ? ` · team of ${p.currentTeamSize} now` : ""}`] as [string, string]] : []),
    ...(p.commitment ? [["Commitment", p.commitment] as [string, string]] : []),
    ...(p.opportunity ? [["Registration closes", wibDateLong(p.opportunity.deadline)] as [string, string]] : []),
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12">
      <Link href={p.opportunity ? `/partners?competition=${p.opportunity.slug}` : "/partners"} className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Seeking Partner</Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="min-w-0">
          <div className="rise flex flex-wrap items-center gap-2">
            <span className={`label-mono rounded px-1.5 py-0.5 ${lft ? "bg-cream-200 text-navy" : "bg-mint-100 text-navy"}`}>{KIND_LABEL[p.kind]}</span>
            {p.status !== "open" && <span className="label-mono rounded bg-slate-100 px-1.5 py-0.5 text-ink-3">{p.status}</span>}
          </div>
          <h1 className="rise mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-base text-ink-2">
            For {p.opportunity ? <Link href={`/competitions/${p.opportunity.slug}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">{compName}</Link> : p.event ? <Link href={`/events/${p.event.slug}`} className="font-medium text-brand-700 hover:underline">{compName}</Link> : <span className="font-medium">{compName}</span>}
          </p>

          <section className="mt-6" aria-label={lft ? "Roles offered" : "Roles needed"}>
            <h2 className="label-mono text-ink-3">{lft ? "Can take" : "Needs"}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">{p.rolesNeeded.map((r) => <li key={r} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">{roleText(r)}</li>)}</ul>
            {p.skillsNeeded.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{p.skillsNeeded.map((s) => <li key={s} className="rounded-md bg-paper-2 px-2 py-1 text-xs text-ink-2">{s}</li>)}</ul>}
          </section>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
            {facts.map(([k, v]) => <div key={k}><dt className="text-xs text-ink-3">{k}</dt><dd className="mt-0.5 text-sm font-semibold text-ink">{v}</dd></div>)}
          </dl>

          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">{lft ? "About them" : "About the project"}</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink-2">{p.description}</p>
          </section>

          <section className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <Avatar name={p.owner.name} src={p.owner.avatarUrl} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{p.owner.username && p.owner.directoryVisible ? <Link href={`/u/${p.owner.username}`} className="hover:underline">{p.owner.name}</Link> : p.owner.name ?? "Member"}</p>
              <p className="truncate text-sm text-ink-3">{p.owner.headline || [p.owner.major, p.owner.faculty].filter(Boolean).join(" · ") || "GSIC member"}</p>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            <ShareWhatsApp text={share} path={`/partners/${p.id}`} />
            {p.opportunity?.guidebookUrl && <a href={p.opportunity.guidebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-ink-2 hover:border-slate-400"><FileText className="h-4 w-4" aria-hidden="true" />Guidebook</a>}
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start"><PartnerActions id={p.id} open={open} /></aside>
      </div>
    </main>
  );
}
