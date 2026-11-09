import Link from "next/link";
import BrandMark from "@/components/portal/BrandMark";
import CampusSilhouette from "@/components/hub/CampusSilhouette";
import { CAMPUS_LINKS } from "@/lib/campus-links";

export default function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-navy pb-16 text-slate-300 md:pb-0">
      <CampusSilhouette className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-full max-w-5xl text-white/[0.06]" strokeWidth={1} />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="text-base font-bold text-white font-heading">GSIC <span className="font-medium text-mint">Hub</span></span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Opportunities, research and innovation support from the Ganesha Students Innovation Center at ITB.</p>
        </div>
        <nav aria-label="Hub">
          <h2 className="label-mono text-cream">Hub</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/competitions" className="hover:text-white">Competitions</Link></li>
            <li><Link href="/partners" className="hover:text-white">Seeking Partner</Link></li>
            <li><Link href="/opportunities?type=scholarship" className="hover:text-white">Scholarships</Link></li>
            <li><Link href="/competitions/submit" className="hover:text-white">Submit a competition</Link></li>
          </ul>
        </nav>
        <nav aria-label="Campus">
          <h2 className="label-mono text-cream">Campus</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CAMPUS_LINKS.map((l) => <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">{l.label}</a></li>)}
            <li><Link href="/links" className="hover:text-white">All links</Link></li>
          </ul>
        </nav>
        <nav aria-label="Programs">
          <h2 className="label-mono text-cream">Programs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/events/pkm-bootcamp-2027" className="hover:text-white">PKM Bootcamp</Link></li>
            <li><Link href="/events/sandbox-sesi-1" className="hover:text-white">The Sandbox</Link></li>
            <li><Link href="/pkm" className="hover:text-white">PKM guide</Link></li>
            <li><Link href="/about" className="hover:text-white">About GSIC Research</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </nav>
      </div>
      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">© {new Date().getFullYear()} GSIC, Ganesha Students Innovation Center, Institut Teknologi Bandung</p>
      </div>
    </footer>
  );
}
