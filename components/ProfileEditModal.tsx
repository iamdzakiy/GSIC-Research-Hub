"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Upload } from "lucide-react";
import { UserProfile, FACULTY_MAJOR_MAP } from "@/lib/types";
import { updateUserProfile } from "@/services/userService";
import { useAuth } from "@/components/AuthContext";

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_COLORS: Record<string, string> = {
  blue: "from-[#3352CD] to-[#5CE3B6]",
  mint: "from-[#5CE3B6] to-[#7ff0cc]",
  cream: "from-[#F2F8C9] to-[#d4df9e]",
  dark: "from-gray-900 to-gray-700",
  purple: "from-[#7c3aed] to-[#a78bfa]",
  sunset: "from-[#f59e0b] to-[#ec4899]",
};

const SKILLS_PRESET = [
  "Research", "Python", "JavaScript", "Data Analysis", "UI/UX Design",
  "Figma", "React", "Next.js", "PostgreSQL", "Machine Learning",
  "Presentation", "Writing", "Photography", "Video Editing", "Marketing",
];

export default function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        faculty: userProfile.faculty,
        major: userProfile.major,
        year: userProfile.year,
        whatsapp: userProfile.whatsapp,
        bio: userProfile.bio,
        classcardTheme: userProfile.classcardTheme,
        skills: userProfile.skills,
      });
      setSelectedSkills(userProfile.skills || []);
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    setFormData((prev) => ({ ...prev, skills: updated }));
  };

  const handleAvatarUpload = () => {
    alert("Avatar upload would open a file picker. This is a placeholder.");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setLocalMessage("");
    try {
      await updateUserProfile(user.id, {
        name: formData.name,
        faculty: formData.faculty,
        major: formData.major,
        year: typeof formData.year === "number" ? formData.year : parseInt(String(formData.year || 0)) || new Date().getFullYear(),
        whatsapp: formData.whatsapp || "",
        bio: formData.bio || "",
        classcardTheme: formData.classcardTheme || "blue",
        skills: selectedSkills,
      });
      await refreshProfile();
      setLocalMessage("Profile saved!");
      setTimeout(() => setLocalMessage(""), 2000);
    } catch (e) {
      setLocalMessage("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const availableMajors = formData.faculty
    ? (FACULTY_MAJOR_MAP[formData.faculty as keyof typeof FACULTY_MAJOR_MAP] || [])
    : [];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-heading">Edit Profile</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="space-y-5">
            {/* Avatar + Name Row */}
            <div className="flex gap-4 items-end">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${THEME_COLORS[formData.classcardTheme || "blue"]} flex items-center justify-center text-white font-bold text-xl overflow-hidden border-2 border-white/20`}
                >
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (formData.name || user?.email || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAvatarUpload}
                  className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </motion.button>
              </div>

              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]"
                  placeholder="e.g. Ganesha Student"
                />
              </div>
            </div>

            {/* Faculty & Major */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Faculty</label>
                <select
                  name="faculty"
                  value={formData.faculty || ""}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]"
                >
                  <option value="">Select</option>
                  {Object.keys(FACULTY_MAJOR_MAP).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Major</label>
                <select
                  name="major"
                  value={formData.major || ""}
                  onChange={handleChange}
                  disabled={!formData.faculty}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6] disabled:opacity-50"
                >
                  <option value="">Select</option>
                  {availableMajors.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year & WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1">Year</label>
                <select
                  name="year"
                  value={formData.year || new Date().getFullYear()}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#5CE3B6]"
                >
                  {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp || ""}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6]"
                  placeholder="e.g. +628123456789"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs text-white/40 mb-2">Card Theme</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(THEME_COLORS).map(([theme, gradient]) => (
                  <motion.button
                    key={theme}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData((prev) => ({ ...prev, classcardTheme: theme as any }))}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 transition-all ${
                      formData.classcardTheme === theme
                        ? "border-white shadow-lg shadow-white/20"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    title={theme}
                  />
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs text-white/40 mb-2">
                Skills ({selectedSkills.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-[#5CE3B6]/20 text-[#5CE3B6] px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className="hover:text-white/50 transition"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {SKILLS_PRESET.filter((s) => !selectedSkills.includes(s)).map((skill) => (
                  <motion.button
                    key={skill}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSkillToggle(skill)}
                    className="text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 px-2.5 py-1 rounded-full transition"
                  >
                    + {skill}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs text-white/40 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ""}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-[#5CE3B6] resize-none text-sm"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition font-medium text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] hover:from-[#4a6cf7] hover:to-[#5a7cff] text-white font-medium text-sm transition shadow-lg shadow-[#3352CD]/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>

          {localMessage && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-xs"
              style={{
                color: localMessage.includes("saved") ? "#5CE3B6" : "#ff6b6b",
              }}
            >
              {localMessage}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
