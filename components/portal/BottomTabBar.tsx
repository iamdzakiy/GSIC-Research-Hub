"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Trophy, User, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/hub/useNotifications";

/** Phone navigation: five fixed tabs. The desktop top bar takes over from md. */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unread } = useNotifications();

  // Opportunity detail pages carry their own sticky apply bar; auth screens need the room.
  if (pathname.startsWith("/auth") || /^\/opportunities\/[^/]+/.test(pathname) || pathname.startsWith("/partners/new")) return null;

  const tabs = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/competitions", label: "Competitions", Icon: Trophy },
    { href: "/partners", label: "Partners", Icon: Users },
    { href: "/events", label: "Events", Icon: CalendarDays },
    { href: user ? "/dashboard" : "/auth?mode=signin", label: "Profile", Icon: User, badge: unread },
  ];
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]!));

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ href, label, Icon, badge }) => (
          <li key={label}>
            <Link href={href} aria-current={active(href) ? "page" : undefined}
              className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600", active(href) ? "text-brand-700" : "text-slate-600")}>
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {badge ? <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold leading-4 text-white" aria-label={`${badge} waiting`}>{badge > 9 ? "9+" : badge}</span> : null}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
