"use client";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { updateUserProfile } from "@/services/userService";
import ProfileFields, { EMPTY_PROFILE, type ProfileValues } from "@/components/portal/ProfileFields";

/** Light profile editor used on the dashboard. Same pickers as sign-up step 2. */
export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [values, setValues] = useState<ProfileValues>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userProfile) return;
    setName(userProfile.name ?? "");
    setBio(userProfile.bio ?? "");
    setValues({
      faculty: userProfile.faculty ?? "", major: userProfile.major ?? "", year: userProfile.year ?? new Date().getFullYear(),
      whatsapp: userProfile.whatsapp ?? "", skills: userProfile.skills ?? [], softSkills: userProfile.softSkills ?? [],
      interests: userProfile.interests ?? [], archetype: userProfile.archetype ?? "", bccRole: userProfile.bccRole ?? "",
    });
    setError(null);
  }, [open, userProfile]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open || !user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.id, { name: name.trim(), bio: bio.trim(), ...values, archetype: values.archetype || null, bccRole: values.bccRole || null } as never);
      await refreshProfile();
      onClose();
    } catch (er) {
      setError(er instanceof Error ? er.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-navy/70 p-4" role="dialog" aria-modal="true" aria-label="Edit profile" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Edit profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <label htmlFor="pm-name" className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input id="pm-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          </div>
          <ProfileFields value={values} onChange={setValues} />
          <div>
            <label htmlFor="pm-bio" className="mb-1.5 block text-sm font-medium text-slate-700">Bio <span className="font-normal text-slate-400">(optional, 500 characters)</span></label>
            <textarea id="pm-bio" rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
