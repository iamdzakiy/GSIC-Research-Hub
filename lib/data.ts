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
// PKM BOOTCAMP EVENT
// ============================================================
export const PKM_BOOTCAMP_MODULES: EventModule[] = [
  {
    id: "mod-1",
    title: "Research Proposal Writing",
    description: "Learn how to structure and write a compelling research proposal.",
    cluster: "technology",
    durationHours: 3,
    order: 1,
  },
  {
    id: "mod-2",
    title: "Literature Review & Methodology",
    description: "Systematic approach to literature review and research design.",
    cluster: "technology",
    durationHours: 4,
    order: 2,
  },
  {
    id: "mod-3",
    title: "Data Analysis with Python",
    description: "Hands-on data analysis using Python and statistical tools.",
    cluster: "technology",
    durationHours: 5,
    order: 3,
  },
  {
    id: "mod-4",
    title: "Scientific Paper Writing",
    description: "Structure, citations, and publication-ready formatting.",
    cluster: "technology",
    durationHours: 3,
    order: 4,
  },
  {
    id: "mod-5",
    title: "Presentation & Pitch Skills",
    description: "Delivering compelling research presentations and pitches.",
    cluster: "art",
    durationHours: 2,
    order: 5,
  },
];

export const PKM_BOOTCAMP_SPEAKERS: EventSpeaker[] = [
  {
    name: "Dr. Rina Wijaya",
    title: "Head of Research, GSIC",
    organization: "GSIC & Ganesha University",
    topic: "Research Proposal Writing & Methodology",
  },
  {
    name: "Prof. Budi Santoso",
    title: "Professor of Computer Science",
    organization: "STEI, Ganesha University",
    topic: "Data Analysis & Scientific Computing",
  },
  {
    name: "Dr. Sari Lestari",
    title: "Publication Specialist",
    organization: "GSIC Research",
    topic: "Scientific Writing & Publishing",
  },
];

export const PKM_BOOTCAMP: GSICEvent = {
  id: "event-pkm-bootcamp",
  type: "bootcamp",
  title: "GSIC PKM Bootcamp",
  description:
    "Cohort-based intensive training for the Student Creativity Program (PKM). " +
    "From research ideation to competitive proposal submission. This bootcamp " +
    "includes pre-test and post-test assessments to measure learning outcomes.",
  shortDescription:
    "Cohort-based training for PKM research proposals with pre/post assessments.",
  startDate: "2026-07-15",
  endDate: "2026-09-30",
  registrationDeadline: "2026-07-10",
  location: "Hybrid (Online + GSIC Lab, KM ITB)",
  maxParticipants: 50,
  currentParticipants: 24,
  status: "upcoming",
  clusters: ["technology", "art"],
  modules: PKM_BOOTCAMP_MODULES,
  speakers: PKM_BOOTCAMP_SPEAKERS,
  // Pre/post tests - this event HAS them
  hasPreTest: true,
  hasPostTest: true,
  preTestId: "test-pkm-pre",
  postTestId: "test-pkm-post",
  preTestExplanation:
    "Before the bootcamp begins, you will take a pre-test to assess your " +
    "baseline knowledge of research methodology. This helps us tailor the " +
    "training to your needs. The pre-test is not graded for selection — " +
    "it's purely for learning measurement.",
  postTestExplanation:
    "After completing the bootcamp, you will take a post-test to measure " +
    "your learning progress. Comparing your pre-test and post-test scores " +
    "shows how much you've improved. The post-test is also not graded for " +
    "selection — it's for learning assessment.",
  createdBy: "admin-seed",
  createdAt: "2026-06-01",
};

// ============================================================
// THE SANDBOX EVENT
// ============================================================
export const SANDBOX_MODULES: EventModule[] = [
  {
    id: "sb-mod-1",
    title: "Design Thinking Workshop",
    description: "Empathy, ideation, and prototyping for real-world problems.",
    cluster: "art",
    durationHours: 4,
    order: 1,
  },
  {
    id: "sb-mod-2",
    title: "Interdisciplinary Collaboration",
    description: "Working across majors and fields to solve complex challenges.",
    cluster: "discovery",
    durationHours: 3,
    order: 2,
  },
  {
    id: "sb-mod-3",
    title: "Rapid Prototyping Lab",
    description: "Build and test your ideas quickly with hands-on tools.",
    cluster: "technology",
    durationHours: 6,
    order: 3,
  },
  {
    id: "sb-mod-4",
    title: "Innovation Showcase",
    description: "Present your project to mentors and the GSIC community.",
    cluster: "art",
    durationHours: 2,
    order: 4,
  },
];

export const SANDBOX_EVENT: GSICEvent = {
  id: "event-sandbox",
  type: "sandbox",
  title: "The Sandbox",
  description:
    "GSIC's interdisciplinary co-creation space. Cross-pollination of ideas " +
    "across majors and fields. Join teams from different faculties to build " +
    "innovative solutions to real-world challenges. No pre-test or post-test " +
    "required — just bring your curiosity and creativity!",
  shortDescription:
    "Interdisciplinary co-creation space for cross-major innovation projects.",
  startDate: "2026-08-01",
  endDate: "2026-10-31",
  registrationDeadline: "2026-07-25",
  location: "GSIC Sandbox Lab, KM ITB",
  maxParticipants: 40,
  currentParticipants: 18,
  status: "upcoming",
  clusters: ["art", "technology", "discovery"],
  modules: SANDBOX_MODULES,
  speakers: [],
  // This event does NOT have pre/post tests
  hasPreTest: false,
  hasPostTest: false,
  preTestExplanation: "",
  postTestExplanation: "",
  createdBy: "admin-seed",
  createdAt: "2026-06-01",
};

// ============================================================
// TESTS
// ============================================================
export const SEED_TESTS: Test[] = [
  {
    id: "test-pkm-pre",
    eventId: "event-pkm-bootcamp",
    type: "pre",
    title: "PKM Bootcamp Pre-Test",
    description:
      "Assesses your baseline knowledge of research methodology before the bootcamp.",
    questions: [
      {
        id: "pre-q1",
        text: "What is the first step in research methodology?",
        type: "multiple_choice",
        options: ["Research proposal", "Literature review", "Data analysis"],
        correctAnswer: "Research proposal",
        points: 3,
      },
      {
        id: "pre-q2",
        text: "Which research type uses numerical data?",
        type: "multiple_choice",
        options: ["Qualitative", "Quantitative", "Mixed-method"],
        correctAnswer: "Quantitative",
        points: 3,
      },
      {
        id: "pre-q3",
        text: "What section comes first in a scientific paper?",
        type: "multiple_choice",
        options: ["Abstract", "Introduction", "Conclusion"],
        correctAnswer: "Abstract",
        points: 3,
      },
    ],
    durationMinutes: 15,
    passingScore: 60,
  },
  {
    id: "test-pkm-post",
    eventId: "event-pkm-bootcamp",
    type: "post",
    title: "PKM Bootcamp Post-Test",
    description:
      "Measures your learning progress after completing the bootcamp.",
    questions: [
      {
        id: "post-q1",
        text: "What is the backbone of a good research design?",
        type: "multiple_choice",
        options: ["Research design", "Sampling technique", "Data interpretation"],
        correctAnswer: "Research design",
        points: 3,
      },
      {
        id: "post-q2",
        text: "Which tool is best for statistical analysis?",
        type: "multiple_choice",
        options: ["SPSS", "Python", "R"],
        correctAnswer: "R",
        points: 3,
      },
      {
        id: "post-q3",
        text: "Where do you discuss implications of findings?",
        type: "multiple_choice",
        options: ["Discussion", "Methodology", "References"],
        correctAnswer: "Discussion",
        points: 3,
      },
    ],
    durationMinutes: 15,
    passingScore: 60,
  },
];

// ============================================================
// ALL EVENTS
// ============================================================
export const SEED_EVENTS: GSICEvent[] = [PKM_BOOTCAMP, SANDBOX_EVENT];

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
export const THEME_COLORS: Record<string, string> = {
  blue: "from-[#3352CD] via-[#4a6cf7] to-[#5CE3B6]",
  mint: "from-[#5CE3B6] via-[#7ff0cc] to-[#F2F8C9]",
  cream: "from-[#F2F8C9] via-[#d4df9e] to-[#3352CD]",
  dark: "from-gray-900 via-gray-800 to-gray-700",
  purple: "from-[#7c3aed] via-[#a78bfa] to-[#c4b5fd]",
  sunset: "from-[#f59e0b] via-[#ef4444] to-[#ec4899]",
};

export const THEME_NAMES: Record<string, string> = {
  blue: "Royal Blue",
  mint: "Mint Green",
  cream: "Pale Cream",
  dark: "Dark Mode",
  purple: "Royal Purple",
  sunset: "Sunset",
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function formatDate(d: string): string {
  if (!d) return "—";
  const p = d.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(p[1]) - 1] || p[1]} ${p[2]}, ${p[0]}`;
}

export function isExpired(deadline: string): boolean {
  return deadline ? new Date(deadline) < new Date(new Date().toDateString()) : false;
}

export function daysUntil(deadline: string): number {
  if (!deadline) return Infinity;
  const now = new Date(new Date().toDateString());
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCountdownClass(days: number): string {
  if (days <= 0) return "text-red-400";
  if (days <= 7) return "text-red-400";
  if (days <= 30) return "text-yellow-400";
  return "text-[#5CE3B6]";
}

export function getCountdownText(days: number): string {
  if (days <= 0) return "⚠️ Expired";
  if (days === 1) return "🔥 1 day left!";
  if (days <= 7) return `🔥 ${days} days left`;
  if (days <= 30) return `⚠️ ${days} days left`;
  return `📅 ${days} days left`;
}

export function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    research: "🔬",
    scholarship: "🎓",
    career: "💼",
    competition: "🏆",
  };
  return map[type] || "🏷️";
}

export function getTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getCategoryIcon(cat: string): string {
  const map: Record<string, string> = {
    report: "📊",
    paper: "📄",
    module: "📚",
    proposal: "💡",
    other: "📁",
  };
  return map[cat] || "📄";
}

export function getCategoryLabel(cat: string): string {
  return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Other";
}

export function getEventStatusColor(status: string): string {
  const map: Record<string, string> = {
    upcoming: "text-[#5CE3B6]",
    ongoing: "text-[#F2F8C9]",
    completed: "text-white/50",
  };
  return map[status] || "text-white/50";
}

export function getEventStatusText(status: string): string {
  const map: Record<string, string> = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
  };
  return map[status] || status;
}

// ============================================================
// LOCAL STORAGE KEYS
// ============================================================
export const STORAGE_KEYS = {
  opportunities: "gsic_opportunities_v3",
  curated: "gsic_curated_v3",
  events: "gsic_events_v3",
  tests: "gsic_tests_v3",
  registrations: "gsic_registrations_v3",
  testResults: "gsic_test_results_v3",
  documents: "gsic_documents_v3",
  adminAccounts: "gsic_admin_accounts_v3",
};
