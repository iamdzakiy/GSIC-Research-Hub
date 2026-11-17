"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Counts { open: boolean; started: number; submitted: number; inProgress: number }

/** Big QR and count for a projector. Polls the public counts every 4 seconds. */
export default function LiveBoard({ code, title, site }: { code: string; title: string; site: string }) {
  const [origin, setOrigin] = useState(site);
  const [svg, setSvg] = useState("");
  const [c, setC] = useState<Counts | null>(null);
  useEffect(() => { if (!site) setOrigin(window.location.origin); }, [site]);
  const url = `${origin}/a/${code}`;
  useEffect(() => {
    if (!origin) return;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b1f3a", light: "#ffffff" } }).then(setSvg).catch(() => setSvg(""));
  }, [origin, url]);
  useEffect(() => {
    let live = true;
    const pull = async () => { try { const r = await fetch(`/api/assessments/live?code=${code}`, { cache: "no-store" }); if (r.ok && live) setC(await r.json()); } catch { /* keep the last count */ } };
    void pull(); const i = setInterval(pull, 4000);
    return () => { live = false; clearInterval(i); };
  }, [code]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-10 text-center">
      <h1 lang="id" className="max-w-3xl font-display text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
      <div role="img" aria-label={`QR code for ${url}`} className="mt-8 w-72 max-w-full sm:w-96 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-6 font-mono text-3xl font-bold tracking-wide text-ink sm:text-5xl">{url.replace(/^https?:\/\//, "")}</p>
      <p className="mt-8 text-lg text-ink-2" aria-live="polite">
        {c ? <><span className="font-display text-5xl font-extrabold text-ink">{c.submitted}</span> submitted · <span className="font-semibold">{c.inProgress}</span> in progress{c.open ? "" : " · not open"}</> : "…"}
      </p>
    </main>
  );
}
