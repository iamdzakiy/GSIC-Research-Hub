import type { Metadata } from "next";
import SubmitCompetitionForm from "@/components/hub/SubmitCompetitionForm";

export const metadata: Metadata = { title: "Submit a competition · GSIC Hub" };

export default function SubmitCompetitionPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="label-mono text-brand-700">Competitions</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Submit a competition</h1>
      <p className="mt-2 text-sm leading-6 text-ink-3">Saw one in a group chat? Add the basics here. An admin checks it and publishes it, usually within a day.</p>
      <div className="mt-6"><SubmitCompetitionForm /></div>
    </main>
  );
}
