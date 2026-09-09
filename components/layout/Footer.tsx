import Link from "next/link";
import { Globe, AtSign, Send } from "lucide-react";

/**
 * Global site footer with brand, quick links and socials.
 */
export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0B1120]/60 backdrop-blur-xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="GSIC Hub" className="w-9 h-9 object-contain" />
            <span className="text-lg font-bold font-heading">
              <span className="gradient-text">GSIC</span>
              <span className="text-white/50 text-sm font-normal">Hub</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-xs">
            The central ecosystem for opportunities, research and innovation from the Ganesha
            Students Innovation Center.
          </p>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-sm font-semibold text-white font-heading mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link href="/#opportunities" className="hover:text-[#5CE3B6] transition">Opportunities</Link></li>
            <li><Link href="/events/pkm-bootcamp" className="hover:text-[#5CE3B6] transition">PKM Bootcamp</Link></li>
            <li><Link href="/events/sandbox" className="hover:text-[#5CE3B6] transition">The Sandbox</Link></li>
            <li><Link href="/blog" className="hover:text-[#5CE3B6] transition">Blog</Link></li>
            <li><Link href="/documents" className="hover:text-[#5CE3B6] transition">Resources</Link></li>
          </ul>
        </div>

        {/* Programs */}
        <div>
          <h4 className="text-sm font-semibold text-white font-heading mb-3">Programs</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link href="/auth?mode=signup" className="hover:text-[#5CE3B6] transition">Join GSIC</Link></li>
            <li><Link href="/dashboard" className="hover:text-[#5CE3B6] transition">My Dashboard</Link></li>
            <li><Link href="/admin" className="hover:text-[#5CE3B6] transition">Admin Console</Link></li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className="text-sm font-semibold text-white font-heading mb-3">Connect</h4>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition">
              <AtSign className="w-4 h-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition">
              <Send className="w-4 h-4" />
            </a>
            <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} GSIC Hub · Ganesha Students Innovation Center · KM ITB
      </div>
    </footer>
  );
}