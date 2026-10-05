"use client";

// Shared profile pickers: used by sign-up step 2 and the dashboard profile editor.
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { FACULTY_MAJOR_MAP, FACULTY_NAMES } from "@/lib/types";
import { ARCHETYPES, BCC_ROLES, HARD_SKILLS, INTERESTS, SOFT_SKILLS, YEARS } from "@/lib/profile-options";

export interface ProfileValues {
  faculty: string;
  major: string;
  year: number;
  whatsapp: string;
  skills: string[];
  softSkills: string[];
  interests: string[];
  archetype: string;
  bccRole: string;
}

export const EMPTY_PROFILE: ProfileValues = {
  faculty: "", major: "", year: new Date().getFullYear(), whatsapp: "",
  skills: [], softSkills: [], interests: [], archetype: "", bccRole: "",
};

const toggle = (list: string[], v: string, max: number) =>
  list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v];

const field = (err?: string) =>
  cn(
    "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2",
    err ? "border-rose-400 focus:ring-rose-500/20" : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20"
  );

function Chips({
  items, selected, onToggle, max,
}: { items: readonly { id: string; label: string; hint?: string }[]; selected: string[]; onToggle: (id: string) => void; max: number }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {items.map((it) => {
        const on = selected.includes(it.id);
        const locked = !on && selected.length >= max;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onToggle(it.id)}
            aria-pressed={on}
            disabled={locked}
            title={it.hint}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700",
              locked && "cursor-not-allowed opacity-40"
            )}
          >
            {on && <Check className="h-3 w-3" aria-hidden="true" />}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

const asItems = (a: readonly string[]) => a.map((x) => ({ id: x, label: x }));

function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-medium text-slate-800">{title}</legend>
      {note && <p className="-mt-1 text-xs text-slate-500">{note}</p>}
      {children}
    </fieldset>
  );
}

export default function ProfileFields({
  value, onChange, errors = {},
}: { value: ProfileValues; onChange: (v: ProfileValues) => void; errors?: Record<string, string> }) {
  const set = <K extends keyof ProfileValues>(k: K, v: ProfileValues[K]) => onChange({ ...value, [k]: v });
  const majors = FACULTY_MAJOR_MAP[value.faculty] ?? [];
  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="faculty" className="mb-1.5 block text-sm font-medium text-slate-700">Faculty or school</label>
          <select id="faculty" value={value.faculty} onChange={(e) => onChange({ ...value, faculty: e.target.value, major: "" })} className={field(errors.faculty)}>
            <option value="">Select faculty or school</option>
            {Object.keys(FACULTY_NAMES).map((code) => (
              <option key={code} value={code}>{code} · {FACULTY_NAMES[code]}</option>
            ))}
          </select>
          <Err k="faculty" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="major" className="mb-1.5 block text-sm font-medium text-slate-700">Major</label>
          <select id="major" value={value.major} onChange={(e) => set("major", e.target.value)} disabled={!value.faculty} className={cn(field(errors.major), "disabled:bg-slate-50 disabled:text-slate-400")}>
            <option value="">{value.faculty ? "Select major" : "Choose a faculty first"}</option>
            {majors.map((m) => <option key={m.code} value={m.name}>{m.name}</option>)}
          </select>
          <Err k="major" />
        </div>
        <div>
          <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-slate-700">Entry year</label>
          <select id="year" value={value.year} onChange={(e) => set("year", Number(e.target.value))} className={field(errors.year)}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-slate-700">WhatsApp <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="whatsapp" inputMode="tel" autoComplete="tel" value={value.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+62 812 0000 0000" className={field(errors.whatsapp)} />
          <Err k="whatsapp" />
        </div>
      </div>

      <Group title="Archetype" note="The role you usually play in a team. Pick one.">
        <div className="grid gap-2 sm:grid-cols-3">
          {ARCHETYPES.map((a) => {
            const on = value.archetype === a.id;
            return (
              <button key={a.id} type="button" aria-pressed={on} onClick={() => set("archetype", on ? "" : a.id)}
                className={cn("rounded-xl border p-3.5 text-left transition-colors", on ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-slate-300 bg-white hover:border-brand-400")}>
                <span className="block text-sm font-semibold text-slate-900">{a.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{a.hint}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Business case role" note="Where you slot in on a business case team. Pick one.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BCC_ROLES.map((r) => {
            const on = value.bccRole === r.id;
            return (
              <button key={r.id} type="button" aria-pressed={on} onClick={() => set("bccRole", on ? "" : r.id)}
                className={cn("rounded-xl border p-3 text-left transition-colors", on ? "border-mint-600 bg-mint-50 ring-1 ring-mint-600" : "border-slate-300 bg-white hover:border-mint-400")}>
                <span className="block text-sm font-semibold text-slate-900">{r.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{r.hint}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Interests" note={`Programs and tracks you want to hear about. Up to 8. Selected: ${value.interests.length}`}>
        <Chips items={INTERESTS} selected={value.interests} max={8} onToggle={(id) => set("interests", toggle(value.interests, id, 8))} />
      </Group>

      <Group title="Hard skills" note={`Technical skills you can show. Up to 12. Selected: ${value.skills.length}`}>
        <Chips items={asItems(HARD_SKILLS)} selected={value.skills} max={12} onToggle={(id) => set("skills", toggle(value.skills, id, 12))} />
      </Group>

      <Group title="Soft skills" note={`How you work with others. Up to 8. Selected: ${value.softSkills.length}`}>
        <Chips items={asItems(SOFT_SKILLS)} selected={value.softSkills} max={8} onToggle={(id) => set("softSkills", toggle(value.softSkills, id, 8))} />
      </Group>
    </div>
  );
}
