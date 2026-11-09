import type { Metadata } from "next";
import { Suspense } from "react";
import TeamsClient from "@/components/teams/TeamsClient";

export const metadata: Metadata = { title: "My posts and responses · GSIC Hub" };

export default function ManagePartnersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}><TeamsClient /></Suspense>
    </main>
  );
}
