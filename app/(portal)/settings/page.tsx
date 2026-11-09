import type { Metadata } from "next";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata: Metadata = { title: "Settings · GSIC Hub" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="label-mono text-brand-700">Settings</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Your profile and email</h1>
      <div className="mt-8"><SettingsClient /></div>
    </main>
  );
}
