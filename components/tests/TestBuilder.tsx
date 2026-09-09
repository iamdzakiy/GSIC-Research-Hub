"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X, Save, Settings2 } from "lucide-react";
import { Test, TestQuestion, TestType } from "@/lib/types";
import { createTest, updateTest } from "@/services/tests";
import { cn } from "@/lib/cn";

interface DraftQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "essay";
  options: string[];
  correctAnswer: string;
  points: number;
}

interface TestBuilderProps {
  eventId: string;
  initial?: Test | null;
  onClose: () => void;
  onSaved: (test: Test) => void;
}

const newDraftQuestion = (): DraftQuestion => ({
  id: Math.random().toString(36).slice(2, 10),
  text: "",
  type: "multiple_choice",
  options: ["", ""],
  correctAnswer: "",
  points: 10,
});

export default function TestBuilder({ eventId, initial, onClose, onSaved }: TestBuilderProps) {
  const [title, setTitle] = useState(initial?.title || "Pre-Test");
  const [type, setType] = useState<TestType>(initial?.type || "pre");
  const [description, setDescription] = useState(initial?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || 15);
  const [passingScore, setPassingScore] = useState(initial?.passingScore || 60);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => {
    if (initial?.questions && Array.isArray(initial.questions)) {
      return (initial.questions as TestQuestion[]).map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer || "",
        points: q.points,
      }));
    }
    return [newDraftQuestion()];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(questions[0]?.id || null);

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const setOption = (qid: string, idx: number, value: string) => {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.id !== qid) return q;
        const options = q.options.map((o, i) => (i === idx ? value : o));
        return { ...q, options };
      })
    );
  };

  const removeOption = (qid: string, idx: number) => {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.id !== qid) return q;
        const options = q.options.filter((_, i) => i !== idx);
        let correctAnswer = q.correctAnswer;
        if (correctAnswer === q.options[idx]) correctAnswer = "";
        return { ...q, options, correctAnswer };
      })
    );
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Test title is required.";
    if (!questions.length) return "Add at least one question.";
    for (const q of questions) {
      if (!q.text.trim()) return "Every question needs text.";
      if (q.points < 0) return "Question points cannot be negative.";
      if (q.type === "multiple_choice") {
        const filled = q.options.filter((o) => o.trim()).length;
        if (filled < 2) return "Each multiple-choice question needs at least 2 options.";
        if (!q.correctAnswer) return "Mark a correct answer for each multiple-choice question.";
      }
    }
    return null;
  };

  const buildPayload = () => ({
    eventId,
    type,
    title,
    description: description || undefined,
    durationMinutes,
    passingScore,
    questions: questions
      .filter((q) => q.text.trim())
      .map((q) => ({
        id: q.id,
        text: q.text.trim(),
        type: q.type,
        options: q.type === "multiple_choice" ? q.options.filter((o) => o.trim()) : undefined,
        correctAnswer: q.type === "multiple_choice" ? q.correctAnswer : undefined,
        points: q.points,
      })),
  });

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = initial
        ? await updateTest(initial.id, buildPayload())
        : await createTest(buildPayload());
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save test.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl glass-strong rounded-2xl border border-white/10 shadow-2xl my-6"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#5CE3B6]" />
            <h3 className="font-bold text-white font-heading">
              {initial ? "Edit Test" : "Create Test"}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1">Test Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#3352CD]/60 focus:outline-none focus:ring-2 focus:ring-[#3352CD]/20"
                placeholder="e.g. PKM Bootcamp Pre-Test"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/60 mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#3352CD]/60 focus:outline-none focus:ring-2 focus:ring-[#3352CD]/20"
                placeholder="Short description shown to participants"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Type</label>
              <div className="flex gap-2">
                {(["pre", "post"] as TestType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition",
                      type === t
                        ? "bg-[#3352CD]/40 border-[#3352CD] text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                    )}
                  >
                    {t === "pre" ? "Pre-Test" : "Post-Test"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Minutes</label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#3352CD]/60 focus:outline-none focus:ring-2 focus:ring-[#3352CD]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Pass %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#3352CD]/60 focus:outline-none focus:ring-2 focus:ring-[#3352CD]/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/80 font-heading">Questions</h4>
            <button
              type="button"
              onClick={() => {
                const q = newDraftQuestion();
                setQuestions((qs) => [...qs, q]);
                setExpanded(q.id);
              }}
              className="flex items-center gap-1 text-xs bg-[#3352CD]/40 hover:bg-[#3352CD]/60 text-white px-3 py-1.5 rounded-full transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={q.id} className="glass rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-2">
                  <input
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder={`Question ${qi + 1}`}
                    className="flex-1 bg-transparent border-b border-white/10 focus:border-[#5CE3B6]/60 px-1 py-1 text-sm text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
                      if (expanded === q.id) setExpanded(null);
                    }}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition"
                    aria-label="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.id, { type: "multiple_choice", options: q.options.length ? q.options : ["", ""] })}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border transition",
                      q.type === "multiple_choice"
                        ? "bg-[#5CE3B6]/20 border-[#5CE3B6]/40 text-[#5CE3B6]"
                        : "bg-white/5 border-white/10 text-white/50"
                    )}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuestion(q.id, { type: "essay", correctAnswer: "" })}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border transition",
                      q.type === "essay"
                        ? "bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#A78BFA]"
                        : "bg-white/5 border-white/10 text-white/50"
                    )}
                  >
                    Essay
                  </button>
                  <label className="text-xs text-white/50 ml-auto items-center gap-1 flex">
                    Points
                    <input
                      type="number"
                      min={0}
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) || 0 })}
                      className="w-16 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-[#3352CD]/60"
                    />
                  </label>
                </div>

                {q.type === "multiple_choice" && (
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition",
                            q.correctAnswer === opt
                              ? "border-[#5CE3B6] bg-[#5CE3B6]/30"
                              : "border-white/25 hover:border-white/50"
                          )}
                          title="Mark as correct"
                        >
                          {q.correctAnswer === opt && <span className="w-1.5 h-1.5 rounded-full bg-[#5CE3B6]" />}
                        </button>
                        <input
                          value={opt}
                          onChange={(e) => setOption(q.id, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3352CD]/50"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, oi)}
                            className="p-1 text-white/30 hover:text-red-400 transition"
                            aria-label="Remove option"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })}
                      className="text-xs text-[#5CE3B6] hover:text-[#7ff0cc] transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-[#3352CD]/30 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Test"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}