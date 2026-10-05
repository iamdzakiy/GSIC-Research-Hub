"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Landing page for e-mailed action links (verify / magic link / recovery).
 * supabase-js consumes the token in the URL hash and fires an auth event;
 * we then forward to `?next=` (same-origin paths only).
 */
function Callback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sp.get("next") || "/dashboard";
    const next = /^\/(?!\/)/.test(raw) ? raw : "/dashboard";

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description") || sp.get("error_description");
    if (hashError) {
      setError(/expired|invalid/i.test(hashError) ? "This link has expired or was already used. Request a new one." : hashError.replace(/\+/g, " "));
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION")) router.replace(next);
    });
    supabase.auth.getSession().then(({ data: { session } }) => session && router.replace(next));
    const timeout = setTimeout(() => setError("Could not verify this link. Request a new one and try again."), 12_000);
    return () => { data.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [router, sp]);

  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      {error ? (
        <div role="alert">
          <TriangleAlert className="mx-auto h-10 w-10 text-rose-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 font-heading">Invalid link</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link href="/auth?mode=signin" className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand-600 px-6 text-sm font-medium text-white hover:bg-brand-700">Back to sign in</Link>
        </div>
      ) : (
        <div role="status">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-600">Verifying your link…</p>
        </div>
      )}
    </main>
  );
}

export default function CallbackPage() {
  return <Suspense><Callback /></Suspense>;
}
