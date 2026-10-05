import SiteFooter from "@/components/portal/SiteFooter";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Shell for pages that keep their original (dark-designed) internals: events,
 * admin, dashboard sub-widgets. `legacy-bridge` (see globals.css) re-maps their
 * white-alpha utilities onto the light palette so the whole site reads as one.
 * Pages render their own <Navbar/> (now the shared SiteHeader).
 */
export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="legacy-bridge relative z-10 flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <div id="main-content" className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}
