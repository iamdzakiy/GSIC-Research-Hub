// One avatar everywhere a person appears. Uploaded photo or preset SVG; initials on a GSIC colour otherwise.
import { cn } from "@/lib/cn";

const TONES = ["bg-brand-600 text-white", "bg-mint-400 text-navy", "bg-cream-200 text-navy", "bg-navy text-mint-300", "bg-brand-100 text-brand-800"];
const tone = (seed: string) => TONES[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]!;
export const initials = (name?: string | null) => (name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "G";

export default function Avatar({ name, src, size = 40, className }: { name?: string | null; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} loading="lazy" style={style} className={cn("shrink-0 rounded-full bg-paper-2 object-cover ring-1 ring-black/5", className)} />;
  }
  return (
    <span aria-hidden="true" style={style} className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold", tone(name ?? "G"), className)}>
      {initials(name)}
    </span>
  );
}
