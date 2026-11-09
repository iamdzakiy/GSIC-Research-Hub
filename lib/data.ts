// ============================================================
// GSIC Hub - Seed Data
// ============================================================
import {
  Opportunity,
  CuratedOpportunity,
  GSICEvent,
  Test,
  EventModule,
  EventSpeaker,
} from "./types";

// ============================================================
// OPPORTUNITIES
// ============================================================
export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1001",
    type: "research",
    title: "GSIC Research Grant 2026",
    slug: "gsic-research-grant-2026",
    organizer: "GSIC & Ganesha University",
    description: "Funded research program for undergraduate students across all faculties.",
    requiredSkills: ["Research", "Proposal Writing", "Data Analysis"],
    benefits: ["Stipend $600/mo", "Mentorship", "Publication support"],
    deadline: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
    isAnnual: true,
    link: "https://research.gsic.ganesha.edu",
    posterUrl: null,
    status: "active",
    cpName: "Dr. Rina Wijaya",
    cpContact: "rina@gsic.ganesha.edu",
  },
  {
    id: "opp-1002",
    type: "scholarship",
    title: "MEXT Scholarship 2026",
    slug: "mext-scholarship-2026",
    organizer: "MEXT Japan",
    description: "Full scholarship for study in Japan. All expenses covered.",
    requiredSkills: ["Japanese", "Academic Excellence"],
    benefits: ["Full tuition", "Monthly stipend", "Airfare"],
    deadline: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
    isAnnual: true,
    link: "https://www.mext.go.jp",
    posterUrl: null,
    status: "active",
    cpName: "Prof. Tanaka",
    cpContact: "mext-scholar@gsic.ganesha.edu",
  },
  {
    id: "opp-1003",
    type: "career",
    title: "Tech Internship Program",
    slug: "tech-internship-program",
    organizer: "GSIC Career Center",
    description: "3-month paid internship at leading tech companies.",
    requiredSkills: ["Programming", "Problem Solving"],
    benefits: ["Paid internship", "Networking", "Certificate"],
    deadline: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    isAnnual: true,
    link: "https://career.gsic.ganesha.edu",
    posterUrl: null,
    status: "active",
    cpName: "Mr. Budi Santoso",
    cpContact: "career@gsic.ganesha.edu",
  },
  {
    id: "opp-1004",
    type: "competition",
    title: "ITB Innovation Competition 2026",
    slug: "itb-innovation-competition-2026",
    organizer: "ITB",
    description: "Annual inter-university innovation competition with cash prizes.",
    requiredSkills: ["Innovation", "Teamwork", "Presentation"],
    benefits: ["$5,000 prize", "Recognition", "Networking"],
    deadline: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    isAnnual: true,
    link: "https://competition.itb.ac.id",
    posterUrl: null,
    status: "active",
    cpName: "Dr. Andi Prasetyo",
    cpContact: "competition@itb.ac.id",
  },
];

// ============================================================
// CURATED OPPORTUNITIES (annual/recurring)
// ============================================================
export const SEED_CURATED: CuratedOpportunity[] = [
  {
    id: "cur-2001",
    title: "SRP (Student Research Program)",
    type: "research",
    organizer: "GSIC Research",
    monthOpen: "01-15",
    description: "Annual research program. Prepare your proposal from now!",
    link: "https://srp.gsic.ganesha.edu",
  },
  {
    id: "cur-2002",
    title: "LPDP Scholarship",
    type: "scholarship",
    organizer: "LPDP RI",
    monthOpen: "03-01",
    description: "Full government scholarship for master/PhD. Start preparing documents.",
    link: "https://lpdp.kemenkeu.go.id",
  },
  {
    id: "cur-2003",
    title: "KM ITB Competition Fest",
    type: "competition",
    organizer: "KM ITB",
    monthOpen: "02-20",
    description: "Annual inter-university competition. Build your team early!",
    link: "https://km.itb.ac.id",
  },
  {
    id: "cur-2004",
    title: "IRN (Innovation Research Network)",
    type: "research",
    organizer: "GSIC",
    monthOpen: "04-10",
    description: "Network-based research collaboration. Opens every April.",
    link: "https://irn.gsic.ganesha.edu",
  },
  {
    id: "cur-2005",
    title: "GSIC Summer Internship",
    type: "career",
    organizer: "GSIC Career",
    monthOpen: "05-01",
    description: "Paid summer internship at top tech companies. Apply early!",
    link: "https://career.gsic.ganesha.edu",
  },
];

// ============================================================
// DOCUMENTS
// ============================================================
export const SEED_DOCUMENTS = [
  {
    id: "doc-5001",
    userId: "",
    title: "PKM Guidebook 2026",
    type: "proposal" as const,
    url: "https://drive.google.com",
    uploadedAt: "2026-06-01",
  },
  {
    id: "doc-5002",
    userId: "",
    title: "Research Report Template",
    type: "report" as const,
    url: "https://drive.google.com",
    uploadedAt: "2026-06-01",
  },
  {
    id: "doc-5003",
    userId: "",
    title: "Bootcamp Module - Week 1",
    type: "proposal" as const,
    url: "https://drive.google.com",
    uploadedAt: "2026-06-01",
  },
];

// ============================================================
// THEME COLORS
// ============================================================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function getTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
