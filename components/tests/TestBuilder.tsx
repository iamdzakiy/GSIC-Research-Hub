"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Plus, Trash2, X, Save, Settings2, Upload } from "lucide-react";
import type { Test, TestQuestion, TestSection } from "@/lib/types";
import { createTest, updateTest } from "@/services/tests";
import { testFields } from "@/lib/validation/tests";
import { cn } from "@/lib/cn";

type QType = TestQuestion["type"];
interface DraftQuestion extends Omit<TestQuestion, "options"> { options: string[]; section: string }

const TYPES: [QType, string][] = [
  ["multiple_choice", "Multiple choice (scored)"], ["likert", "Likert 1–5"], ["nps", "NPS 0–10"], ["single_choice", "Single choice"],
  ["multi_select", "Multi select"], ["short_text", "Short text"], ["long_text", "Long text"], ["essay", "Essay (old tests)"],
];
const WITH_OPTIONS: QType[] = ["multiple_choice", "single_choice", "multi_select"];
const uid = () => Math.random().toString(36).slice(2, 10);
const blank = (): DraftQuestion => ({ id: uid(), text: "", type: "multiple_choice", options: ["", ""], correctAnswer: "", points: 10, section: "" });

const field = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-600/60 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const lab = "block text-xs font-medium text-white/60 mb-1";

function toDrafts(t?: Test | null): DraftQuestion[] {
  if (t?.sections?.length) return t.sections.flatMap((s) => s.questions.map((q) => ({ ...q, options: q.options ?? [], section: s.title })));
  if (t?.questions?.length) return t.questions.map((q) => ({ ...q, options: q.options ?? [], section: "" }));
  return [blank()];
}

interface Props { eventId: string; initial?: Test | null; onClose: () => void; onSaved: (test: Test) => void }

export default function TestBuilder({ eventId, initial, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title || "Pre-test");
  const [kind, setKind] = useState<NonNullable<Test["kind"]>>(initial?.kind ?? (initial?.type === "post" ? "post_test" : "pre_test"));
  const [description, setDescription] = useState(initial?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 15);
  const [passingScore, setPassingScore] = useState(initial?.passingScore ?? 0);
  const [pairKey, setPairKey] = useState(initial?.pairKey ?? "");
  const [episode, setEpisode] = useState<string>(initial?.episode ? String(initial.episode) : "");
  const [access, setAccess] = useState<NonNullable<Test["access"]>>(initial?.access ?? "registered");
  const [showAnswersAfter, setShow] = useState<NonNullable<Test["showAnswersAfter"]>>(initial?.showAnswersAfter ?? (initial?.kind === "pre_test" ? "pair_closed" : "submit"));
  const [shuffleQuestions, setSQ] = useState(initial?.shuffleQuestions ?? false);
  const [shuffleOptions, setSO] = useState(initial?.shuffleOptions ?? false);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => toDrafts(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const survey = kind === "survey";

  const patch = (id: string, p: Partial<DraftQuestion>) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const setType = (id: string, type: QType) => patch(id, { type, options: WITH_OPTIONS.includes(type) ? (questions.find((q) => q.id === id)?.options.length ? questions.find((q) => q.id === id)!.options : ["", ""]) : [], points: type === "multiple_choice" ? 10 : 0, scale: type === "likert" ? 5 : undefined });

  function build() {
    const clean: TestQuestion[] = questions.filter((q) => q.text.trim()).map(({ section: _s, options, ...q }) => {
      void _s;
      const hasOpt = WITH_OPTIONS.includes(q.type);
      return { ...q, text: q.text.trim(), options: hasOpt ? options.map((o) => o.trim()).filter(Boolean) : undefined, correctAnswer: q.type === "multiple_choice" ? q.correctAnswer : undefined, points: q.type === "multiple_choice" || q.type === "essay" ? q.points : 0 };
    });
    let sections: TestSection[] | null = null;
    if (survey) {
      sections = [];
      for (const q of questions.filter((x) => x.text.trim())) {
        const c = clean.find((x) => x.id === q.id)!;
        const last = sections[sections.length - 1];
        if (last && last.title === q.section) last.questions.push(c); else sections.push({ title: q.section, questions: [c] });
      }
    }
    return { eventId, kind, title: title.trim(), description: description || null, durationMinutes: survey ? 0 : durationMinutes, passingScore: survey ? 0 : passingScore, pairKey: pairKey || null, episode: episode ? Number(episode) : null, access, showAnswersAfter: survey ? "never" as const : showAnswersAfter, shuffleQuestions, shuffleOptions, questions: survey ? [] : clean, sections };
  }

  const validate = (): string | null => {
    if (!title.trim()) return "A title is required.";
    if (!questions.some((q) => q.text.trim())) return "Add at least one question.";
    for (const q of questions.filter((x) => x.text.trim())) {
      if (WITH_OPTIONS.includes(q.type) && q.options.filter((o) => o.trim()).length < 2) return "Each choice question needs at least 2 options.";
      if (q.type === "multiple_choice" && !q.options.map((o) => o.trim()).includes((q.correctAnswer ?? "").trim())) return "Mark a correct answer for each multiple-choice question.";
    }
    const r = testFields.safeParse(build());
    return r.success ? null : r.error.issues[0]?.message ?? "Check the fields.";
  };

  async function save() {
    const problem = validate();
    if (problem) return setError(problem);
    setSaving(true); setError(null);
    try {
      const body = build() as never;
      onSaved(initial ? await updateTest(initial.id, body) : await createTest(body));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save."); }
    finally { setSaving(false); }
  }

  function importJson() {
    try {
      const j = JSON.parse(importText) as Partial<Test> & { questions?: TestQuestion[]; sections?: TestSection[] };
      if (j.title) setTitle(j.title);
      if (j.description) setDescription(j.description);
      if (j.kind) setKind(j.kind);
      if (typeof j.durationMinutes === "number") setDurationMinutes(j.durationMinutes);
      if (typeof j.passingScore === "number") setPassingScore(j.passingScore);
      if (j.pairKey) setPairKey(j.pairKey);
      if (j.episode) setEpisode(String(j.episode));
      if (j.showAnswersAfter) setShow(j.showAnswersAfter);
      if (typeof j.shuffleQuestions === "boolean") setSQ(j.shuffleQuestions);
      if (typeof j.shuffleOptions === "boolean") setSO(j.shuffleOptions);
      const drafts = toDrafts({ questions: j.questions ?? [], sections: j.sections ?? null } as Test);
      if (j.questions?.length || j.sections?.length) setQuestions(drafts);
      setImportOpen(false); setImportText(""); setError(null);
    } catch { setError("That is not valid JSON."); }
  }

  return (
    <div className="fixed inset-0 z-[105] flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-2xl bg-navy rounded-2xl border border-white/10 shadow-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-mint" /><h3 className="font-bold text-white font-heading">{initial ? "Edit test" : "Create test"}</h3></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setImportOpen((v) => !v)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white"><Upload className="w-3.5 h-3.5" />Import JSON</button>
            <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {importOpen && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label htmlFor="tb-import" className={lab}>Paste a test or survey object (title, questions or sections, …)</label>
              <textarea id="tb-import" rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} className={cn(field, "font-mono text-xs")} />
              <button type="button" onClick={importJson} className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">Load into the form</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label htmlFor="tb-title" className={lab}>Title</label><input id="tb-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} /></div>
            <div className="sm:col-span-2"><label htmlFor="tb-desc" className={lab}>Description (shown on the start screen)</label><input id="tb-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={field} /></div>
            <div><label htmlFor="tb-kind" className={lab}>Kind</label>
              <select id="tb-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}><option value="pre_test">Pre-test</option><option value="post_test">Post-test</option><option value="survey">Survey</option></select></div>
            <div><label htmlFor="tb-access" className={lab}>Who can take it</label>
              <select id="tb-access" value={access} onChange={(e) => setAccess(e.target.value as typeof access)} className={field}><option value="registered">Registered participants</option><option value="signed_in">Anyone signed in (creates the registration)</option></select></div>
            {!survey && <>
              <div><label htmlFor="tb-min" className={lab}>Minutes</label><input id="tb-min" type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)} className={field} /></div>
              <div><label htmlFor="tb-pass" className={lab}>Passing score % (0 = no pass or fail)</label><input id="tb-pass" type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value) || 0)} className={field} /></div>
              <div><label htmlFor="tb-show" className={lab}>Show answers</label>
                <select id="tb-show" value={showAnswersAfter} onChange={(e) => setShow(e.target.value as typeof showAnswersAfter)} className={field}><option value="submit">After submit</option><option value="pair_closed">After the post-test</option><option value="never">Never</option></select></div>
              <div className="flex items-end gap-4 text-xs text-white/70">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={shuffleQuestions} onChange={(e) => setSQ(e.target.checked)} />Shuffle questions</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={shuffleOptions} onChange={(e) => setSO(e.target.checked)} />Shuffle options</label>
              </div>
            </>}
            <div><label htmlFor="tb-pair" className={lab}>Pair key (links pre, post and survey)</label><input id="tb-pair" value={pairKey} onChange={(e) => setPairKey(e.target.value)} className={field} placeholder="bootcamp-ep1" /></div>
            <div><label htmlFor="tb-ep" className={lab}>Episode (Bootcamp only)</label><input id="tb-ep" type="number" min={1} max={20} value={episode} onChange={(e) => setEpisode(e.target.value)} className={field} /></div>
          </div>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/80 font-heading">{survey ? "Items" : "Questions"} ({questions.length})</h4>
            <button type="button" onClick={() => setQuestions((qs) => [...qs, { ...blank(), type: survey ? "likert" : "multiple_choice", options: survey ? [] : ["", ""], points: survey ? 0 : 10, scale: survey ? 5 : undefined, section: qs[qs.length - 1]?.section ?? "" }])} className="flex items-center gap-1 text-xs bg-brand-600/40 hover:bg-brand-600/60 text-white px-3 py-1.5 rounded-full"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>

          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl p-4 border border-white/10 bg-white/[0.03]">
                <div className="flex items-start gap-2">
                  <input aria-label={`Question ${qi + 1}`} value={q.text} onChange={(e) => patch(q.id, { text: e.target.value })} placeholder={`Question ${qi + 1}`} className="flex-1 bg-transparent border-b border-white/10 focus:border-mint/60 px-1 py-1 text-sm text-white focus:outline-none" />
                  <button type="button" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5" aria-label="Remove question"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <select aria-label="Type" value={q.type} onChange={(e) => setType(q.id, e.target.value as QType)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  {survey && <input aria-label="Section" value={q.section} onChange={(e) => patch(q.id, { section: e.target.value })} placeholder="Section" className="w-32 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white" />}
                  {q.type !== "multiple_choice" && q.type !== "essay" && <label className="flex items-center gap-1"><input type="checkbox" checked={q.required === true} onChange={(e) => patch(q.id, { required: e.target.checked })} />Required</label>}
                  {(q.type === "multiple_choice" || q.type === "essay") && <label className="ml-auto flex items-center gap-1">Points<input type="number" min={0} value={q.points} onChange={(e) => patch(q.id, { points: Number(e.target.value) || 0 })} className="w-16 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-center text-white" /></label>}
                </div>
                {q.type === "likert" && <div className="mt-2 grid grid-cols-2 gap-2"><input aria-label="Low label" value={q.lowLabel ?? ""} onChange={(e) => patch(q.id, { lowLabel: e.target.value })} placeholder="Low label" className={field} /><input aria-label="High label" value={q.highLabel ?? ""} onChange={(e) => patch(q.id, { highLabel: e.target.value })} placeholder="High label" className={field} /></div>}
                {WITH_OPTIONS.includes(q.type) && (
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        {q.type === "multiple_choice" && <button type="button" onClick={() => patch(q.id, { correctAnswer: opt })} className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", q.correctAnswer === opt && opt ? "border-mint bg-mint/30" : "border-white/25 hover:border-white/50")} title="Mark as correct" aria-label={`Mark option ${oi + 1} as correct`}>{q.correctAnswer === opt && opt && <span className="w-1.5 h-1.5 rounded-full bg-mint" />}</button>}
                        <input aria-label={`Option ${oi + 1}`} value={opt} onChange={(e) => patch(q.id, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)), correctAnswer: q.correctAnswer === opt ? e.target.value : q.correctAnswer })} placeholder={`Option ${oi + 1}`} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-600/50" />
                        {q.options.length > 2 && <button type="button" onClick={() => patch(q.id, { options: q.options.filter((_, i) => i !== oi), correctAnswer: q.correctAnswer === opt ? "" : q.correctAnswer })} className="p-1 text-white/30 hover:text-red-400" aria-label="Remove option"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => patch(q.id, { options: [...q.options, ""] })} className="text-xs text-mint flex items-center gap-1"><Plus className="w-3 h-3" /> Add option</button>
                  </div>
                )}
                {q.type === "multiple_choice" && <textarea aria-label="Explanation" value={q.explanation ?? ""} onChange={(e) => patch(q.id, { explanation: e.target.value })} placeholder="Explanation shown after the test (optional)" rows={2} className={cn(field, "mt-3")} />}
              </div>
            ))}
          </div>

          {error && <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 text-sm bg-brand-600 text-white hover:bg-brand-700 px-5 py-2 rounded-full font-medium disabled:opacity-50"><Save className="w-4 h-4" />{saving ? "Saving…" : initial ? "Save changes" : "Create"}</button>
        </div>
      </m.div>
    </div>
  );
}
