import type { Metadata } from "next";
import { Suspense } from "react";
import PartnerForm from "@/components/partners/PartnerForm";

export const metadata: Metadata = { title: "Post · Seeking Partner · GSIC Hub" };

export default function NewPartnerPostPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="label-mono text-brand-700">Seeking Partner</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Post what you need</h1>
      <p className="mt-2 text-sm leading-6 text-ink-3">Specific posts get answers. Name the roles, say what each will do, and how much time it takes.</p>
      <div className="mt-6"><Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}><PartnerForm /></Suspense></div>
    </main>
  );
}
