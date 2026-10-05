import SiteHeader from "@/components/portal/SiteHeader";
import SiteFooter from "@/components/portal/SiteFooter";
import { ToastProvider } from "@/components/ui/Toast";
import ScrollProgress from "@/components/portal/motion/ScrollProgress";

/** Light portal shell used by every public page. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative z-10 flex min-h-screen flex-col bg-slate-50 pt-16 text-slate-900 antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
          Skip to main content
        </a>
        <SiteHeader />
        <ScrollProgress />
        <div id="main-content" className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
