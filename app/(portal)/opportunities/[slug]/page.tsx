import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import StatusBadge from "@/components/portal/StatusBadge";
import BenefitPill from "@/components/portal/BenefitPill";
import TagBadge from "@/components/portal/TagBadge";
import ListingCard from "@/components/portal/ListingCard";
import Prose from "@/components/portal/Prose";
import SectionNav from "@/components/portal/detail/SectionNav";
import ShareActions from "@/components/portal/detail/ShareActions";
import { CriteriaList, DeadlineMeter, DocChecklist, FaqList, QuickOverview, Section, Steps, Timeline } from "@/components/portal/detail/Blocks";
import { getOpportunityByKey, getRelatedOpportunities } from "@/lib/opportunities";
import { SCOPE_LABEL, daysLeft, getDisplayStatus } from "@/lib/opportunity-status";
import {
  FUNDING_LABEL, TYPE_CONFIG, buildQuickOverview, deriveBasicCriteria, formatDateTimeId, formatPlace, isOppType, typeLabel,
  type DetailSource,
} from "@/lib/opportunity-config";
import { applyStep, eligibilityItem, faqItem, readList, selectionStage, socialLink, timelineItem } from "@/lib/validation/opportunity";
import { stripToText } from "@/lib/content";

export const dynamic = "force-dynamic";
type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await getOpportunityByKey(decodeURIComponent(params.slug));
  if (!o) return { title: "Opportunity not found · GSIC Hub" };
  const desc = (o.summary || stripToText(o.description)).slice(0, 160);
  return { title: `${o.title} · ${typeLabel(o.type)} · GSIC Hub`, description: desc, openGraph: { title: o.title, description: desc, images: o.posterUrl ? [o.posterUrl] : undefined } };
}

export default async function OpportunityDetailPage({ params }: Props) {
  const key = decodeURIComponent(params.slug);
  const o = await getOpportunityByKey(key);
  if (!o) notFound();

  const now = new Date();
  const status = getDisplayStatus(o, now);
  const closed = status === "closed";
  const left = daysLeft(o.deadline, now);
  const cfg = isOppType(o.type) ? TYPE_CONFIG[o.type] : TYPE_CONFIG.scholarship;

  const overview = buildQuickOverview(o as unknown as DetailSource);
  const criteria = readList(eligibilityItem, o.eligibilityCriteria);
  const required = criteria.filter((c) => c.required !== false).map((c) => c.text);
  const bonus = criteria.filter((c) => c.required === false).map((c) => c.text);
  const basic = deriveBasicCriteria(o as unknown as DetailSource);
  const steps = readList(applyStep, o.applySteps);
  const stages = readList(selectionStage, o.selectionStages);
  const timeline = readList(timelineItem, o.timeline);
  const faqs = readList(faqItem, o.faqs);
  const socials = readList(socialLink, o.socialLinks);
  const place = formatPlace(o.city, o.country, o.location);
  const related = await getRelatedOpportunities(o, 3, now);

  const hasBenefits = o.benefits.length > 0 || !!o.programBenefits || !!o.fundingType || !!o.fundingAmount;
  const hasEligibility = required.length + bonus.length + basic.length > 0 || !!o.eligibility;
  const hasApply = steps.length > 0 || !!o.howToApply;
  const hasSchedule = timeline.length > 0 || stages.length > 0;
  const hasContact = !!(o.cpName || o.cpContact || o.contactEmail || socials.length || o.link);

  const nav = [
    { id: "ringkasan", label: "Quick overview" },
    { id: "tentang", label: cfg.headings.about },
    hasEligibility && { id: "kriteria", label: cfg.headings.eligibility },
    hasBenefits && { id: "benefit", label: cfg.headings.benefits },
    hasApply && { id: "cara-mendaftar", label: cfg.headings.apply },
    o.requiredDocuments.length > 0 && { id: "dokumen", label: "Required documents" },
    hasSchedule && { id: "jadwal", label: "Schedule and selection" },
    o.tips && { id: "tips", label: "Tips" },
    faqs.length > 0 && { id: "faq", label: "FAQ" },
    hasContact && { id: "kontak", label: "Contact and links" },
  ].filter(Boolean) as { id: string; label: string }[];

  const ctaLabel = closed ? "Applications closed" : status === "upcoming" ? "Opens soon" : cfg.applyCta;
  const Cta = ({ className = "" }: { className?: string }) =>
    o.link && !closed && status !== "upcoming" ? (
      <a href={o.link} target="_blank" rel="noopener noreferrer" className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${className}`}>
        {ctaLabel} <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    ) : (
      <span className={`inline-flex h-11 items-center justify-center rounded-lg bg-slate-100 px-5 text-sm font-medium text-slate-500 ${className}`}>{o.link ? ctaLabel : "Link not available yet"}</span>
    );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link href="/opportunities" className="inline-flex items-center gap-1 hover:text-slate-900"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Opportunities</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/opportunities?type=${o.type}`} className="hover:text-slate-900">{cfg.plural}</Link>
      </nav>

      {/* hero */}
      <header className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">{typeLabel(o.type)}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{SCOPE_LABEL[o.scope] ?? o.scope}</span>
          {o.isAnnual && <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Annual program</span>}
        </div>
        <h1 className="mt-3 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-slate-900 font-heading sm:text-3xl">{o.title}</h1>
        <p className="mt-2 text-base font-medium text-brand-700">{o.organizer}</p>
        {o.summary && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{o.summary}</p>}

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-200 pt-5 sm:grid-cols-4">
          <div><dt className="text-xs text-slate-500">Application deadline</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{formatDateTimeId(o.deadline)}</dd></div>
          {place && <div><dt className="text-xs text-slate-500">Location</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{place}</dd></div>}
          {o.fundingType && <div><dt className="text-xs text-slate-500">Funding</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{FUNDING_LABEL[o.fundingType]}</dd></div>}
          {o.levels.length > 0 && <div><dt className="text-xs text-slate-500">Level</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{o.levels.join(", ")}</dd></div>}
        </dl>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)_19rem]">
        {/* in-page nav */}
        <SectionNav items={nav} className="hidden self-start lg:sticky lg:top-24 lg:block" />

        {/* content */}
        <div className="min-w-0 space-y-12 lg:col-start-2 lg:row-start-1">
          <Section id="ringkasan" title="Quick overview">
            <QuickOverview groups={overview} />
          </Section>

          <Section id="tentang" title={cfg.headings.about}>
            {o.description ? <Prose content={o.description} /> : <p className="text-sm text-slate-500">No description yet.</p>}
            {(o.tags.length > 0 || o.requiredSkills.length > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-1.5">
                {o.requiredSkills.map((t) => <span key={t} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">{t}</span>)}
                {o.tags.map((t) => <TagBadge key={t} tag={t} />)}
              </div>
            )}
          </Section>

          {hasEligibility && (
            <Section id="kriteria" title={cfg.headings.eligibility}>
              <div className="space-y-6">
                <CriteriaList title="Basic requirements" items={basic} tone="basic" />
                <CriteriaList title="Required" items={required} tone="required" />
                <CriteriaList title="Nice to have" items={bonus} tone="bonus" />
                {o.eligibility && <Prose content={o.eligibility} />}
              </div>
            </Section>
          )}

          {hasBenefits && (
            <Section id="benefit" title={cfg.headings.benefits}>
              {(o.fundingType || o.fundingAmount) && (
                <div className="mb-4 rounded-lg border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-900">
                  {o.fundingType && <span className="font-semibold">{FUNDING_LABEL[o.fundingType]}</span>}
                  {o.fundingType && o.fundingAmount && " — "}
                  {o.fundingAmount}
                </div>
              )}
              {o.benefits.length > 0 && <ul className="mb-4 flex flex-wrap gap-2">{o.benefits.map((b) => <BenefitPill key={b}>{b}</BenefitPill>)}</ul>}
              {o.programBenefits && <Prose content={o.programBenefits} />}
            </Section>
          )}

          {hasApply && (
            <Section id="cara-mendaftar" title={cfg.headings.apply}>
              {steps.length > 0 && <Steps steps={steps} />}
              {o.howToApply && <Prose content={o.howToApply} className={steps.length ? "mt-6" : ""} />}
              <div className="mt-6"><Cta className="w-full sm:w-auto" /></div>
            </Section>
          )}

          {o.requiredDocuments.length > 0 && (
            <Section id="dokumen" title="Required documents">
              <DocChecklist items={o.requiredDocuments} />
              <p className="mt-3 text-xs text-slate-500">This list is a summary. Check the organizer's official guide for file format and size rules.</p>
            </Section>
          )}

          {hasSchedule && (
            <Section id="jadwal" title="Schedule and selection process">
              <div className="grid gap-8 md:grid-cols-2">
                {timeline.length > 0 && (<div><h3 className="mb-3 text-sm font-semibold text-slate-900">Key dates</h3><Timeline rows={timeline} /></div>)}
                {stages.length > 0 && (<div><h3 className="mb-3 text-sm font-semibold text-slate-900">Selection stages</h3><Timeline rows={stages.map((s) => ({ phase: s.stage, date: s.date, description: s.description }))} /></div>)}
              </div>
            </Section>
          )}

          {o.tips && (<Section id="tips" title="Tips for applying"><Prose content={o.tips} /></Section>)}
          {faqs.length > 0 && (<Section id="faq" title="Frequently asked questions"><FaqList items={faqs} /></Section>)}

          {hasContact && (
            <Section id="kontak" title="Contact and official links">
              <ul className="grid gap-3 sm:grid-cols-2">
                {(o.cpName || o.cpContact) && (
                  <li className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                    <p className="text-xs text-slate-500">Contact person</p>
                    {o.cpName && <p className="mt-0.5 font-medium text-slate-900">{o.cpName}</p>}
                    {o.cpContact && <p className="mt-1 inline-flex items-center gap-1.5 text-slate-600"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{o.cpContact}</p>}
                  </li>
                )}
                {o.contactEmail && (
                  <li className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                    <p className="text-xs text-slate-500">Email</p>
                    <a href={`mailto:${o.contactEmail}`} className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{o.contactEmail}</a>
                  </li>
                )}
                {o.link && (
                  <li className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                    <p className="text-xs text-slate-500">Official website / application page</p>
                    <a href={o.link} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1.5 break-all font-medium text-brand-700 hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{o.link.replace(/^https?:\/\//, "")}</a>
                  </li>
                )}
                {socials.map((s) => (
                  <li key={s.url} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1.5 break-all font-medium text-brand-700 hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{s.url.replace(/^https?:\/\/(www\.)?/, "")}</a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* sticky summary card */}
        <aside className="space-y-4 self-start lg:sticky lg:top-24 lg:col-start-3 lg:row-start-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <StatusBadge status={status} />
            <p className="mt-4 text-xs text-slate-500">Application deadline</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{formatDateTimeId(o.deadline)}</p>
            {!closed && status !== "upcoming" && (
              <p className={`mt-1 text-sm ${status === "closing" ? "font-medium text-rose-600" : "text-slate-600"}`}>{left <= 0 ? "Ends today" : `${left} ${left === 1 ? "day" : "days"} left`}</p>
            )}
            <div className="mt-3"><DeadlineMeter openDate={o.openDate} deadline={o.deadline} now={now} /></div>
            <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
              {o.quota != null && <div className="flex justify-between gap-3"><dt className="text-slate-500">Places</dt><dd className="font-medium text-slate-900">{o.quota.toLocaleString("en-GB")}</dd></div>}
              {o.fundingType && <div className="flex justify-between gap-3"><dt className="text-slate-500">Funding</dt><dd className="text-right font-medium text-slate-900">{FUNDING_LABEL[o.fundingType]}</dd></div>}
              {place && <div className="flex justify-between gap-3"><dt className="text-slate-500">Location</dt><dd className="text-right font-medium text-slate-900">{place}</dd></div>}
            </dl>
            <div className="mt-5 space-y-3">
              <Cta className="w-full" />
              <ShareActions title={o.title} icsHref={`/api/opportunities/${o.slug}/ics`} />
            </div>
          </div>
          <p className="px-1 text-xs leading-5 text-slate-500">GSIC compiles this information from official sources. It may change. Check the organizer's website for the latest details before you apply.</p>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mt-16 border-t border-slate-200 pt-10">
          <h2 id="related-h" className="mb-6 text-xl font-bold tracking-tight text-slate-900 font-heading">Similar opportunities</h2>
          <div className="space-y-4">{related.map((r) => <ListingCard key={r.id} item={r} compact />)}</div>
        </section>
      )}

      {/* mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <Cta className="w-full" />
      </div>
    </main>
  );
}
