import Link from "next/link";
import { cn } from "@/lib/cn";

/** Branded full-width message block used by error, 404 and empty-route screens. */
export default function StateScreen({ code, title, message, children, tone = "brand" }: {
  code?: string; title: string; message: string; children?: React.ReactNode; tone?: "brand" | "rose";
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      {code && (
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold tracking-wider", tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-mint-100 text-mint-800")}>{code}</span>
      )}
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {children}
        <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Back to home</Link>
      </div>
    </section>
  );
}
