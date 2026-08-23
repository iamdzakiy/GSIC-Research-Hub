// ============================================================
// GSIC-Research-Hub - Type Definitions
// ============================================================

// Re-export Prisma enums so string fields are type-safe without duplicating
// the literal unions in this file.
import { UserRole, OpportunityType, Status, EventType, DocumentType, TestType, RegistrationStatus, Theme } from "../generated/prisma/enums";
export { UserRole, OpportunityType, Status, EventType, DocumentType, TestType, RegistrationStatus, Theme } from "../generated/prisma/enums";

export interface MajorInfo {
  code: string;
  name: string;
}

export const FACULTY_MAJOR_MAP: Record<string, MajorInfo[]> = {
  "FMIPA": [
    { code: "101", name: "Mathematics" },
    { code: "102", name: "Physics" },
    { code: "103", name: "Astronomy" },
    { code: "105", name: "Chemistry" },
    { code: "108", name: "Actuarial Science" },
  ],
  "FITB": [
    { code: "120", name: "Geological Engineering" },
    { code: "128", name: "Meteorology" },
    { code: "129", name: "Oceanography" },
    { code: "151", name: "Geodesy and Geomatics Engineering" },
  ],
  "FTI": [
    { code: "130", name: "Chemical Engineering" },
    { code: "133", name: "Engineering Physics" },
    { code: "134", name: "Industrial Engineering" },
    { code: "143", name: "Food Engineering" },
    { code: "144", name: "Engineering Management" },
    { code: "145", name: "Bioenergy and Chemurgical Engineering" },
    { code: "194", name: "Industrial Engineering (Cirebon Campus)" },
  ],
  "FTMD": [
    { code: "131", name: "Mechanical Engineering" },
    { code: "136", name: "Aerospace Engineering" },
    { code: "137", name: "Materials Engineering" },
  ],
  "FTTM": [
    { code: "121", name: "Mining Engineering" },
    { code: "122", name: "Petroleum Engineering" },
    { code: "123", name: "Geophysical Engineering" },
    { code: "125", name: "Metallurgical Engineering" },
  ],
  "FTSL": [
    { code: "150", name: "Civil Engineering" },
    { code: "153", name: "Environmental Engineering" },
    { code: "155", name: "Ocean Engineering" },
    { code: "157", name: "Environmental Infrastructure Engineering" },
    { code: "158", name: "Water Resources Engineering and Management" },
  ],
  "FSRD": [
    { code: "170", name: "Fine Arts" },
    { code: "171", name: "Craft (Cirebon Campus)" },
    { code: "172", name: "Craft" },
    { code: "173", name: "Interior Design" },
    { code: "174", name: "Visual Communication Design" },
    { code: "175", name: "Product Design" },
  ],
  "SITH": [
    { code: "104", name: "Microbiology" },
    { code: "106", name: "Biology" },
    { code: "112", name: "Bioengineering" },
    { code: "114", name: "Agricultural Engineering" },
    { code: "115", name: "Forestry Engineering" },
    { code: "119", name: "Postharvest Technology" },
  ],
  "STEI": [
    { code: "132", name: "Electrical Engineering" },
    { code: "135", name: "Informatics (Computer Science)" },
    { code: "180", name: "Power Engineering" },
    { code: "181", name: "Telecommunication Engineering" },
    { code: "182", name: "Information Systems and Technology" },
    { code: "183", name: "Biomedical Engineering" },
  ],
  "SF": [
    { code: "107", name: "Pharmaceutical Science and Technology" },
    { code: "116", name: "Clinical and Community Pharmacy" },
  ],
  "SAPPK": [
    { code: "152", name: "Architecture" },
    { code: "154", name: "Urban and Regional Planning" },
    { code: "156", name: "Urban and Regional Planning (Cirebon Campus)" },
  ],
  "SBM": [
    { code: "190", name: "Management" },
    { code: "192", name: "Entrepreneurship" },
  ],
};

export const FACULTY_NAMES: Record<string, string> = {
  "FMIPA": "Faculty of Mathematics and Natural Sciences",
  "FITB": "Faculty of Earth Sciences and Technology",
  "FTI": "Faculty of Industrial Technology",
  "FTMD": "Faculty of Mechanical and Aerospace Engineering",
  "FTTM": "Faculty of Mining and Petroleum Engineering",
  "FTSL": "Faculty of Civil and Environmental Engineering",
  "FSRD": "Faculty of Art and Design",
  "SITH": "School of Life Sciences and Technology",
  "STEI": "School of Electrical Engineering and Informatics",
  "SF": "School of Pharmacy",
  "SAPPK": "School of Architecture, Planning, and Policy Development",
  "SBM": "School of Business and Management",
};

export type Rumpun = "Art" | "Technology" | "Discovery";

export interface UserProfile {
  uid: string;
  htaId: string;
  email: string;
  name: string;
  faculty: string;
  major: string;
  majorCode?: string;
  year: number;
  whatsapp?: string;
  avatarUrl: string | null;
  classcardTheme: Theme;
  skills: string[];
  bio: string;
  isVerified: boolean;
  role: UserRole;
  emailConfirmed?: boolean;
  provider?: string;
  lastSignInAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================
// SPEAKERS
// ============================================================
export interface Speaker {
  id: string;
  name: string;
  roleTitle: string;
  institution: string;
  avatarUrl: string;
  bio?: string;
  linkedinUrl?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// OPPORTUNITIES
// ============================================================
export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  slug: string;
  organizer: string;
  description: string;
  requiredSkills: string[];
  benefits: string[];
  deadline: string;
  isAnnual: boolean;
  link: string;
  posterUrl: string | null;
  status: Status;
  cpName: string;
  cpContact: string;
}

export interface CuratedOpportunity {
  id: string;
  title: string;
  type: OpportunityType;
  organizer: string;
  monthOpen: string;
  description: string;
  link: string;
}

// ============================================================
// EVENTS (PKM-Bootcamp & The Sandbox)
// ============================================================
export interface EventSpeaker {
  name: string;
  title: string;
  organization: string;
  photoUrl?: string;
  topic: string;
}

export interface EventModule {
  id: string;
  title: string;
  description: string;
  cluster: "art" | "technology" | "discovery";
  durationHours: number;
  order: number;
}

export interface GSICEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: Status;
  clusters: ("art" | "technology" | "discovery")[];
  modules: EventModule[];
  speakers: EventSpeaker[];
  hasPreTest: boolean;
  hasPostTest: boolean;
  preTestId?: string;
  postTestId?: string;
  preTestExplanation: string;
  postTestExplanation: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================
// TESTS
// ============================================================
export interface TestQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "essay";
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface Test {
  id: string;
  eventId: string;
  type: TestType;
  title: string;
  description: string;
  questions: TestQuestion[];
  durationMinutes: number;
  passingScore: number;
}

export interface TestAnswer {
  questionId: string;
  answer: string;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  answers: TestAnswer[];
  score: number;
  maxScore: number;
  completedAt: string;
}

// ============================================================
// REGISTRATIONS
// ============================================================
export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: RegistrationStatus;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
  registeredAt: string;
}

// ============================================================
// DOCUMENTS
// ============================================================
export interface Document {
  id: string;
  userId: string;
  title: string;
  author?: string;
  type: DocumentType;
  url: string;
  uploadedAt: string;
}

// ============================================================
// USER PROGRESS
// ============================================================
export interface UserProgress {
  userId: string;
  bootcampsCompleted: number;
  testsTaken: number;
  averageScore: number;
  opportunitiesApplied: number;
  sandboxEventsJoined: number;
  skills: string[];
}