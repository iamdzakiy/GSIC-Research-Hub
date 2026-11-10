import type { Metadata } from "next";
import PageHero from "@/components/hub/PageHero";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata: Metadata = { title: "Settings · GSIC Hub" };

export default function SettingsPage() {
  return (
    <>
      <PageHero compact kicker="Settings" title={<>Your profile <span className="outline-cream">and email</span></>} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SettingsClient />
    </main>
    </>
  );
}
