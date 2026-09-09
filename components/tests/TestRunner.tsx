"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Timer, Send, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { Test, TestAnswer, TestResult } from "@/lib/types";
import { submitTest } from "@/services/tests";
import { cn } from "@/lib/cn";

interface TestRunnerProps {
  test: Test;
  onFinish?: (result: TestResult) => void;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TestRunner({ test, onFinish }: TestRunnerProps) {
  const questions = Array.isArray(test.questions) ? test.questions : [];
  const saveKey = `gsic_test_draft_${test.id}`;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(test.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  // Rehydrate draft answers + remaining time from localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers) setAnswers(draft.answers);
        if (typeof draft.secondsLeft === "number") setSecondsLeft(draft.secondsLeft);
      }
    } catch {
      /* ignore corrupt draft */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft (auto-save) whenever answers or timer change.
  useEffect(() => {
    try {
      localStorage.setItem(
        saveKey,
        JSON.stringify({ answers, secondsLeft, savedAt: Date.now() })
      );
    } catch {
      /* storage unavailable */
    }
  }, [answers, secondsLeft, saveKey]);

  // Countdown timer -> auto-submit on timeout.
  useEffect(() => {
    if (result) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          // Trigger submission asynchronously at zero.
          window.setTimeout(() => doSubmitRef.current(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, test.id]);

  const handleSubmit = async (withWarning = true) => {
    if (submittedRef.current || result) return;
    if (withWarning) {
      const answered = questions.filter((q) => answers[q.id]?.trim()).length;
      const ok = window.confirm(
        `You have answered ${answered} of ${questions.length} questions.\n\nSubmit now?`
      );
      if (!ok) return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const answersList: TestAnswer[] = questions
        .filter((q) => answers[q.id]?.trim())
        .map((q) => ({ questionId: q.id, answer: answers[q.id].trim() }));
      const res = await submitTest(test.id, answersList);
      setResult(res);
      try {
        localStorage.removeItem(saveKey);
      } catch {
        /* ignore */
      }
      onFinish?.(res);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Failed to submit.");
    }
  };

  const doSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    doSubmitRef.current = handleSubmit;
  });

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  // ---------- Result view ----------
  if (result) {
    const passing = (result as TestResult & { passingScore?: number }).passingScore ?? 60;
    const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
    const passed = pct >= passing;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 border border-white/10 text-center"
      >
        <div
          className={cn(
            "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4",
            passed
              ? "bg-[#5CE3B6]/15 text-[#5CE3B6] border border-[#5CE3B6]/40"
              : "bg-red-500/15 text-red-400 border border-red-500/40"
          )}
        >
          {passed ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
        </div>
        <h3 className="text-2xl font-bold text-white font-heading">
          {passed ? "Test Completed!" : "Time's Up"}
        </h3>
        <p className="mt-3 text-5xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-[#3352CD] to-[#5CE3B6]">
          {pct}%
        </p>
        <p className="mt-2 text-sm text-white/60">
          {result.score} / {result.maxScore} points · Passing at {passing}%
        </p>
        <p className={cn("mt-4 inline-flex text-xs font-medium px-3 py-1 rounded-full border",
          passed
            ? "text-[#5CE3B6] border-[#5CE3B6]/40 bg-[#5CE3B6]/10"
            : "text-red-400 border-red-500/40 bg-red-500/10"
        )}>
          {passed ? "Congratulations — you passed!" : "You did not reach the passing score."}
        </p>
      </motion.div>
    );
  }

  // ---------- Quiz view ----------
  return (
    <div className="space-y-5">
      {/* Timer / progress bar */}
      <div className="glass rounded-xl p-4 border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="w-4 h-4 text-[#5CE3B6]" />
          <span className={cn("font-mono font-semibold", secondsLeft <= 60 ? "text-red-400" : "text-white")}>
            {fmt(secondsLeft)}
          </span>
        </div>
        <div className="text-xs text-white/50 text-right">
          {answeredCount} / {questions.length} answered
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={q.id} className="glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-white font-heading leading-snug">
              <span className="text-[#5CE3B6] mr-2">{qi + 1}.</span>
              {q.text}
            </h4>
            <span className="shrink-0 text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {q.points} pts
            </span>
          </div>

          {q.type === "multiple_choice" && q.options && (
            <div className="mt-4 space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={cn(
                      "w-full text-left text-sm px-4 py-2.5 rounded-xl border transition flex items-center gap-3",
                      selected
                        ? "bg-[#3352CD]/30 border-[#3352CD] text-white"
                        : "bg-white/[0.03] border-white/10 text-white/70 hover:border-white/25"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                        selected ? "border-[#5CE3B6] bg-[#5CE3B6]/30" : "border-white/25"
                      )}
                    >
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-[#5CE3B6]" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "essay" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Type your answer…"
              rows={4}
              className="mt-4 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#3352CD]/60 resize-y"
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-white/40 flex items-center gap-1">
          <Save className="w-3.5 h-3.5" /> Answers autosave as you go
        </span>
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-[#3352CD]/30 disabled:opacity-50 transition"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Submitting…" : "Submit Test"}
        </button>
      </div>
    </div>
  );
}