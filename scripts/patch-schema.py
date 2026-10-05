#!/usr/bin/env python3
"""Idempotently patches prisma/schema.prisma for the portal (directory + rich details + links)."""
import sys
p = sys.argv[1] if len(sys.argv) > 1 else "prisma/schema.prisma"
s = open(p).read()

# ---- step 1: directory metadata -------------------------------------------------
if "OpportunityScope" not in s:
    s = s.replace("enum Status {", "enum OpportunityScope {\n  internal\n  external\n}\n\nenum Status {", 1)
    s = s.replace(
        "  howToApply     String?         @db.Text\n  timeline       Json?\n  createdAt      DateTime        @default(now())\n  documents      Document[]\n\n  @@index([status])",
        "  howToApply     String?         @db.Text\n  timeline       Json?\n  scope             OpportunityScope @default(external)\n  levels            String[]\n  benefitCategories String[]\n  openDate          DateTime?\n  quota             Int?\n  createdAt      DateTime        @default(now())\n  documents      Document[]\n\n  @@index([status])\n  @@index([deadline])", 1)
    s = s.replace("  @@index([slug])\n  @@index([status])\n}\n\nmodel Test", "  @@index([slug])\n  @@index([status])\n  @@index([publishedAt])\n}\n\nmodel Test", 1)
    assert "OpportunityScope @default" in s and "@@index([publishedAt])" in s, "step 1 pattern mismatch"

# ---- step 2: rich details + links -----------------------------------------------
if "FundingType" not in s:
    s = s.replace("enum Status {", """enum FundingType {
  fully_funded
  partially_funded
  tuition_only
  stipend
  prize_money
  paid
  unpaid
  self_funded
}

enum AttendanceMode {
  onsite
  online
  hybrid
}

enum LinkStatus {
  published
  hidden
}

enum Status {""", 1)
    s = s.replace("  quota             Int?\n", """  quota             Int?
  // --- rich detail (all optional) ---
  summary             String?          @db.Text
  fundingType         FundingType?
  fundingAmount       String?
  attendanceMode      AttendanceMode?
  city                String?
  country             String?
  ageMin              Int?
  ageMax              Int?
  nationality         String?
  minGpa              Float?
  duration            String?
  programStart        DateTime?
  programEnd          DateTime?
  language            String?
  fieldsOfStudy       String[]
  tags                String[]
  requiredDocuments   String[]
  eligibilityCriteria Json?            // [{ text, required }]
  applySteps          Json?            // [{ title, description }]
  selectionStages     Json?            // [{ stage, description, date? }]
  faqs                Json?            // [{ q, a }]
  quickFacts          Json?            // [{ label, value }] type-specific extras
  socialLinks         Json?            // [{ label, url }]
  tips                String?          @db.Text
  contactEmail        String?
""", 1)
    s = s.replace("  @@index([deadline])\n}", "  @@index([deadline])\n  @@index([type])\n}", 1)
    s += """

model ResourceLink {
  id          String     @id @default(cuid())
  title       String
  url         String     @unique
  description String?    @db.Text
  category    String
  tags        String[]
  isFeatured  Boolean    @default(false)
  order       Int        @default(0)
  status      LinkStatus @default(published)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([category])
  @@index([status])
}
"""
    assert "model ResourceLink" in s and "quickFacts" in s, "step 2 pattern mismatch"

# ---- step 3: gallery -----------------------------------------------------------
if "model GalleryItem" not in s:
    s += """

model GalleryItem {
  id          String   @id @default(cuid())
  title       String
  caption     String?
  imageUrl    String
  eventLabel  String?
  takenAt     DateTime?
  order       Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([isPublished, order])
}
"""
    assert "model GalleryItem" in s

# ---- step 4: richer profile (sign-up pickers) -------------------------------------
if "softSkills" not in s:
    old = "  skills         String[]\n"
    assert old in s, "step 4: User.skills not found"
    s = s.replace(old, old + "  softSkills     String[]\n  interests      String[]\n  archetype      String?\n  bccRole        String?\n", 1)

open(p, "w").write(s)
print("patched", p)
