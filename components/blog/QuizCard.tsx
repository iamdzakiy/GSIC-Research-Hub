import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { EpisodeQuiz } from "@/lib/blog-series";

/** End-of-episode card linking to that episode's tests. Closed tests read "Opens with Episode N". */
export default function QuizCard({ quiz }: { quiz: EpisodeQuiz }) {
  const open = [quiz.pre, quiz.post].filter((t): t is NonNullable<typeof t> => !!t && t.open);
  return (
    <section aria-labelledby="quiz-h" className="print:hidden mt-10 rounded-xl border border-brand-200 bg-brand-50 p-6" lang="id">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-600 text-white"><ClipboardCheck className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="quiz-h" className="font-heading text-lg font-bold tracking-tight text-slate-900">Uji pemahamanmu</h2>
          {open.length > 0 ? (
            <>
              <p className="mt-1 text-sm leading-6 text-slate-700">Tes untuk Episode {quiz.episode} sudah dibuka. Pre-test sebelum sesi, post-test sesudahnya.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {open.map((t) => (
                  <Link key={t.code} href={`/a/${t.code}`} className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
                    {t.kind === "pre_test" ? "Mulai pre-test" : "Mulai post-test"}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm leading-6 text-slate-700">Opens with Episode {quiz.episode}.</p>
          )}
        </div>
      </div>
    </section>
  );
}
