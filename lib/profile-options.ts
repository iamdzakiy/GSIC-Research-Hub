// Single source of truth for the sign-up / profile pickers. Used by the forms AND the API validators.

export const HARD_SKILLS = [
  "Python", "R", "MATLAB", "Statistics", "Machine learning", "Data visualization", "SQL and databases",
  "Web development", "Mobile development", "Embedded systems / IoT", "CAD and 3D modeling", "Circuit design",
  "Lab techniques", "Bioinformatics", "Field survey and GIS", "Financial modeling", "Market research",
  "Technical writing", "Scientific writing", "UI/UX design", "Graphic design", "Video editing",
] as const;

export const SOFT_SKILLS = [
  "Leadership", "Teamwork", "Public speaking", "Project management", "Critical thinking", "Problem solving",
  "Negotiation", "Time management", "Creativity", "Adaptability", "Storytelling", "Networking",
  "Mentoring", "Conflict resolution",
] as const;

/** Interest areas. PKM scheme codes follow the Indonesian student creativity program; ids match the "GSIC Connection Matching Team Database" sheet. */
export const PKM_SCHEMES = [
  { id: "pkm-re", code: "RE", label: "PKM-RE", hint: "Exact science research" },
  { id: "pkm-rsh", code: "RSH", label: "PKM-RSH", hint: "Social and humanities research" },
  { id: "pkm-k", code: "K", label: "PKM-K", hint: "Student entrepreneurship" },
  { id: "pkm-pm", code: "PM", label: "PKM-PM", hint: "Community service" },
  { id: "pkm-pi", code: "PI", label: "PKM-PI", hint: "Applied technology" },
  { id: "pkm-kc", code: "KC", label: "PKM-KC", hint: "Creative works" },
  { id: "pkm-ki", code: "KI", label: "PKM-KI", hint: "Innovative works" },
  { id: "pkm-gft", code: "GFT", label: "PKM-GFT", hint: "Futuristic written ideas" },
  { id: "pkm-ai", code: "AI", label: "PKM-AI", hint: "Scientific articles" },
  { id: "pkm-vgk", code: "VGK", label: "PKM-VGK", hint: "Constructive idea video" },
] as const;

export const INTERESTS = [
  ...PKM_SCHEMES,
  { id: "bcc", label: "Business case competitions", hint: "BCC" },
  { id: "hackathon", label: "Hackathons", hint: "Build under a deadline" },
  { id: "research", label: "Research and publication", hint: "Journals, conferences" },
  { id: "scholarship", label: "Scholarships", hint: "Undergraduate to PhD" },
  { id: "startup", label: "Startups", hint: "Ideas to ventures" },
  { id: "career", label: "Internships and careers", hint: "Industry roles" },
  { id: "design", label: "Design competitions", hint: "Product, spatial, visual" },
  { id: "datasci", label: "Data science", hint: "Analysis and modeling" },
] as const;

/** Team roles from the matching sheet's "balanced research team" model. */
export const PREFERRED_ROLES = [
  { id: "research-lead", label: "Research Lead / PI", hint: "Owns the question and the direction." },
  { id: "methodology-analyst", label: "Methodology / Data Analyst", hint: "Designs the method, handles data." },
  { id: "literature-content", label: "Literature / Content Specialist", hint: "Reviews sources, writes the content." },
  { id: "finance-pm", label: "Finance / Project Management", hint: "Budget, timeline, coordination." },
] as const;

export const PKM_ROLES = [
  { id: "leader", label: "Leader" },
  { id: "member", label: "Member" },
  { id: "either", label: "Either" },
] as const;

export const FIELDS = [
  { id: "science", label: "Science" },
  { id: "engineering", label: "Engineering" },
  { id: "business", label: "Business" },
  { id: "social-humanities", label: "Social & Humanities" },
  { id: "health", label: "Health" },
  { id: "art-design", label: "Art & Design" },
  { id: "technology", label: "Technology" },
] as const;

export const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

export const INTEREST_IDS: string[] = INTERESTS.map((i) => i.id);
export const PREFERRED_ROLE_IDS: string[] = PREFERRED_ROLES.map((r) => r.id);
export const PKM_ROLE_IDS: string[] = PKM_ROLES.map((r) => r.id);
export const FIELD_IDS: string[] = FIELDS.map((f) => f.id);

export const labelOf = (list: readonly { id: string; label: string }[], id?: string | null) => list.find((x) => x.id === id)?.label ?? id ?? "";

/** Normalises a LinkedIn profile URL to https://www.linkedin.com/in/<slug>, or null when it is not one. */
export function normalizeLinkedIn(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^([a-z]{2,3}\.|www\.)?linkedin\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/in\/([^/]+)\/?/i);
    return m ? `https://www.linkedin.com/in/${m[1]}` : null;
  } catch { return null; }
}
