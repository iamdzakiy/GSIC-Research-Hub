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

/** Interest areas. The PKM scheme codes follow the Indonesian student creativity program (PKM). */
export const INTERESTS = [
  { id: "pkm-re", label: "PKM-RE", hint: "Exact science research" },
  { id: "pkm-rsh", label: "PKM-RSH", hint: "Social and humanities research" },
  { id: "pkm-k", label: "PKM-K", hint: "Student entrepreneurship" },
  { id: "pkm-pm", label: "PKM-PM", hint: "Community service" },
  { id: "pkm-pi", label: "PKM-PI", hint: "Applied technology" },
  { id: "pkm-kc", label: "PKM-KC", hint: "Creative works" },
  { id: "pkm-gft", label: "PKM-GFT", hint: "Futuristic written ideas" },
  { id: "pkm-ai", label: "PKM-AI", hint: "Scientific articles" },
  { id: "bcc", label: "Business case competitions", hint: "BCC" },
  { id: "hackathon", label: "Hackathons", hint: "Build under a deadline" },
  { id: "research", label: "Research and publication", hint: "Journals, conferences" },
  { id: "scholarship", label: "Scholarships", hint: "Undergraduate to PhD" },
  { id: "startup", label: "Startups", hint: "Ideas to ventures" },
  { id: "career", label: "Internships and careers", hint: "Industry roles" },
  { id: "design", label: "Design competitions", hint: "Product, spatial, visual" },
  { id: "datasci", label: "Data science", hint: "Analysis and modeling" },
] as const;

export const ARCHETYPES = [
  { id: "hacker", label: "Hacker", hint: "You build the product: code, hardware, experiments." },
  { id: "hipster", label: "Hipster", hint: "You shape the experience: design, story, brand." },
  { id: "hustler", label: "Hustler", hint: "You drive the business: sales, partners, funding." },
] as const;

/** Role you usually take in a business case competition. */
export const BCC_ROLES = [
  { id: "finance", label: "Finance", hint: "Valuation, budgets, unit economics." },
  { id: "analyst", label: "Analyst", hint: "Research, data, structuring the problem." },
  { id: "strategist", label: "Strategist", hint: "Positioning, recommendations, the story." },
  { id: "flex", label: "Flexible", hint: "I fill whichever gap the team has." },
] as const;

export const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

export type ArchetypeId = (typeof ARCHETYPES)[number]["id"];
export type BccRoleId = (typeof BCC_ROLES)[number]["id"];
export const INTEREST_IDS: string[] = INTERESTS.map((i) => i.id);
export const ARCHETYPE_IDS: string[] = ARCHETYPES.map((a) => a.id);
export const BCC_ROLE_IDS: string[] = BCC_ROLES.map((a) => a.id);
