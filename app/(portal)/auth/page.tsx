import type { Metadata } from "next";
import AuthForm, { type AuthMode } from "@/components/portal/AuthForm";

export const metadata: Metadata = { title: "Masuk / Daftar · GSIC Hub", robots: { index: false } };

const MODES: AuthMode[] = ["signin", "signup", "magic", "forgot", "reset"];

export default function AuthPage({ searchParams }: { searchParams: { mode?: string } }) {
  const mode = MODES.includes(searchParams.mode as AuthMode) ? (searchParams.mode as AuthMode) : "signin";
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <AuthForm initialMode={mode} />
      </div>
    </main>
  );
}
