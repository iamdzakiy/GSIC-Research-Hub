import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white font-heading">G</span>
            <span className="text-base font-bold text-white font-heading">GSIC <span className="font-medium text-mint">Hub</span></span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Pusat peluang, riset, dan inovasi Ganesha Students Innovation Center · KM ITB.</p>
        </div>
        <nav aria-label="Peluang">
          <h2 className="text-sm font-semibold text-cream">Peluang</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/opportunities?type=scholarship" className="hover:text-white">Beasiswa</Link></li>
            <li><Link href="/opportunities?type=competition" className="hover:text-white">Kompetisi</Link></li>
            <li><Link href="/opportunities?type=research" className="hover:text-white">Research Grant</Link></li>
            <li><Link href="/opportunities?type=career" className="hover:text-white">Karier & Magang</Link></li>
          </ul>
        </nav>
        <nav aria-label="Sumber">
          <h2 className="text-sm font-semibold text-cream">Sumber</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/links" className="hover:text-white">Kumpulan Pranala</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/documents" className="hover:text-white">Dokumen & Template</Link></li>
          </ul>
        </nav>
        <nav aria-label="Program">
          <h2 className="text-sm font-semibold text-cream">Program</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/events/pkm-bootcamp" className="hover:text-white">PKM Bootcamp</Link></li>
            <li><Link href="/events/sandbox" className="hover:text-white">The Sandbox</Link></li>
            <li><Link href="/auth?mode=signin" className="hover:text-white">Masuk</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">© {new Date().getFullYear()} GSIC — Ganesha Students Innovation Center · KM ITB</p>
      </div>
    </footer>
  );
}
