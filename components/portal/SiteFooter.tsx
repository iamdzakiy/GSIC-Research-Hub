import Link from "next/link";
import BrandMark from "@/components/portal/BrandMark";

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="text-base font-bold text-white font-heading">GSIC <span className="font-medium text-mint">Hub</span></span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Opportunities, research and innovation support from the Ganesha Students Innovation Center at ITB.</p>
        </div>
        <nav aria-label="Opportunities">
          <h2 className="text-sm font-semibold text-cream">Opportunities</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/opportunities?type=scholarship" className="hover:text-white">Scholarships</Link></li>
            <li><Link href="/opportunities?type=competition" className="hover:text-white">Competitions</Link></li>
            <li><Link href="/opportunities?type=research" className="hover:text-white">Research grants</Link></li>
            <li><Link href="/opportunities?type=career" className="hover:text-white">Careers &amp; internships</Link></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <h2 className="text-sm font-semibold text-cream">Resources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/links" className="hover:text-white">Link library</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/documents" className="hover:text-white">Documents &amp; templates</Link></li>
          </ul>
        </nav>
        <nav aria-label="Programs">
          <h2 className="text-sm font-semibold text-cream">Programs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/events/pkm-bootcamp" className="hover:text-white">PKM Bootcamp</Link></li>
            <li><Link href="/events/sandbox" className="hover:text-white">The Sandbox</Link></li>
            <li><Link href="/pkm" className="hover:text-white">PKM guide</Link></li>
            <li><Link href="/about" className="hover:text-white">About GSIC Research</Link></li>
            <li><Link href="/auth?mode=signin" className="hover:text-white">Sign in</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">© {new Date().getFullYear()} GSIC, Ganesha Students Innovation Center, Institut Teknologi Bandung</p>
      </div>
    </footer>
  );
}
