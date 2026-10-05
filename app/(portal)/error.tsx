"use client";
import { useEffect } from "react";
import StateScreen from "@/components/portal/StateScreen";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <StateScreen tone="rose" code="SOMETHING WENT WRONG" title="This page could not be loaded" message="Try again. If the problem continues, contact the GSIC team.">
      {error.digest && <p className="w-full text-xs text-slate-400">Reference code: {error.digest}</p>}
      <button type="button" onClick={reset} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Try again</button>
    </StateScreen>
  );
}
