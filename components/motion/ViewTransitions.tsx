"use client";
// Shared-element navigation with the View Transitions API. A card names its cover and title, the detail page uses the
// same names, and the browser morphs one into the other. Browsers without the API just navigate (template.tsx cross-fades).
import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } };
let finish: (() => void) | null = null;

/** Mount once. Resolves the pending transition when the new route has rendered. */
export default function ViewTransitions() {
  const pathname = usePathname();
  useEffect(() => { finish?.(); finish = null; }, [pathname]);
  return null;
}

export const vtName = (kind: "cover" | "title", id: string) => `vt-${kind}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** A link whose navigation runs inside a view transition. Modified clicks (new tab) behave as normal links. */
export function TransitionLink({ href, children, className, ...rest }: LinkProps & { children: React.ReactNode; className?: string; "aria-label"?: string }) {
  const router = useRouter();
  return (
    <Link href={href} className={className} {...rest} onClick={(e) => {
      const doc = document as VTDocument;
      if (!doc.startViewTransition || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      doc.startViewTransition(() => new Promise<void>((resolve) => {
        finish = resolve;
        router.push(String(href));
        setTimeout(() => { if (finish === resolve) { finish = null; resolve(); } }, 1200); // never hold the page hostage
      }));
    }}>
      {children}
    </Link>
  );
}
