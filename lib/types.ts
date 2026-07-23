// ============================================================
// GSIC-Research-Hub - Type Definitions
// ============================================================

export const FACULTY_MAJOR_MAP = {
  "FITB": ["Meteorology (ME)", "Oceanography (OS)", "Geodesy and Geomatics Engineering (GD)", "Geological Engineering (GL)"],
  "FMIPA": ["Actuarial Science (AK)", "Astronomy (AS)", "Physics (FI)", "Chemistry (KI)", "Mathematics (MA)"],
  "FSRD": ["Interior Design (DI)", "Visual Communication Design (DKV)", "Product Design (DP)", "Craft (KR)", "Visual Art (SR)"],
  "FTMD": ["Aerospace Engineering (AE)", "Material Engineering (MT)", "Mechanical Engineering (MS)"],
  "FTTM": ["Geophysical Engineering (TG)", "Metallurgical Engineering (MG)", "Petroleum Engineering (TM)", "Mining Engineering (TA)"],
  "FTSL": ["Environmental Infrastructure Engineering (IL)", "Water Resources Engineering (SA)", "Ocean Engineering (KL)", "Environmental Engineering (TL)", "Civil Engineering (SI)"],
  "FTI": ["Engineering Management (MR)", "Bioenergy and Chemurgical Engineering (TB)", "Engineering Physics (TF)", "Industrial Engineering (TI)", "Chemical Engineering (TK)", "Food Engineering (PG)"],
  "SAPPK": ["Architecture (AR)", "Urban and Regional Planning (PL)"],
  "SBM": ["Entrepreneurship (MK)", "Management (MB)"],
  "SF": ["Clinical and Community Pharmacy (FK)", "Pharmaceutical Science and Technology (FA)"],
  "SITH": ["Biology (BI)", "Microbiology (BM)", "Bioengineering (BE)", "Forestry Engineering (BW)", "Agricultural Engineering (BA)", "Postharvest Technology (BP)"],
  "STEI": ["Information System and Technology (II)", "Biomedical Engineering (EB)", "Electrical Engineering (EL)", "Electrical Power Engineering (EP)", "Informatics Engineering (IF)", "Telecommunication Engineering (ET)"]
};

export type Rumpun = "Art" | "Technology" | "Discovery";

export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  htaId: string;
  email: string;
  name: string;
  faculty: string;
  major: string;
  year: number;
  whatsapp?: string;
  avatarUrl: string | null;
  classcardTheme: "blue" | "mint" | "cream" | "dark" | "purple" | "sunset";
  skills: string[];
  bio: string;
  isVerified: boolean;
  role: UserRole;
  createdAt: string;
}

// ============================================================
// OPPORTUNITIES
// ============================================================
export type OpportunityType = "research" | "scholarship" | "career" | "competition";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  organizer: string;
  description: string;
  requiredSkills: string[];
  benefits: string[];
  deadline: string;
  isAnnual: boolean;
  link: string;
  posterUrl: string | null;
  status: "active" | "expiring_soon" | "archived";
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
export type EventType = "bootcamp" | "sandbox";

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
  status: "upcoming" | "ongoing" | "completed";
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
  type: "pre" | "post";
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
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
  type: "report" | "portfolio" | "proposal";
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

// ============================================================
// ADMIN ACCOUNTS
// ============================================================
export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: "admin";
  isGenerated: boolean;
  generatedBy: string;
  createdAt: string;
}