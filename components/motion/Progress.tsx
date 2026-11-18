import { cn } from "@/lib/cn";

/** Progress bar filled with the logo gradient. Scales on the X axis only, so it never causes layout work. */
export function ProgressBar({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const p = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className={cn("progress-track", className)}>
      <div className="progress-fill" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/** Content-shaped loading placeholder. Pass the same size classes the real content uses. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Wraps a group of skeletons and tells assistive tech what is loading. */
export function Loading({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div role="status" aria-busy="true" className={className}><span className="sr-only">{label}</span>{children}</div>;
}

/** The logo gradient as an SVG paint server, for rings and bars drawn in SVG. */
export function LogoGradientDef({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="rgb(var(--logo-indigo))" />
      <stop offset="0.34" stopColor="rgb(var(--logo-periwinkle))" />
      <stop offset="0.7" stopColor="rgb(var(--logo-teal))" />
      <stop offset="1" stopColor="rgb(var(--logo-emerald))" />
    </linearGradient>
  );
}
