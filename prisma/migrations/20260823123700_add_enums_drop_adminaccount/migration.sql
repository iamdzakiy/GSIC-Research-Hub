-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('research', 'scholarship', 'career', 'competition');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'archived', 'upcoming', 'ongoing', 'completed');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('bootcamp', 'sandbox');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('report', 'portfolio', 'proposal');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('pre', 'post');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('blue', 'mint', 'cream', 'dark', 'purple', 'sunset');

-- AlterTable: User.role text -> UserRole enum (via a shadow column to safely cast existing string values)
ALTER TABLE "User" ADD COLUMN "role_tmp" "UserRole" DEFAULT 'user';
UPDATE "User" SET "role_tmp" = "role"::"UserRole" WHERE "role" IN ('user', 'admin');
UPDATE "User" SET "role_tmp" = 'user' WHERE "role_tmp" IS NULL;
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_tmp" TO "role";
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

-- AlterTable: User.classcardTheme text -> Theme enum
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "classcardTheme_tmp" "Theme";
UPDATE "User" SET "classcardTheme_tmp" = "classcardTheme"::"Theme"
  WHERE "classcardTheme" IN ('blue', 'mint', 'cream', 'dark', 'purple', 'sunset');
UPDATE "User" SET "classcardTheme_tmp" = 'blue' WHERE "classcardTheme_tmp" IS NULL;
ALTER TABLE "User" DROP COLUMN "classcardTheme";
ALTER TABLE "User" RENAME COLUMN "classcardTheme_tmp" TO "classcardTheme";
ALTER TABLE "User" ALTER COLUMN "classcardTheme" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "classcardTheme" SET DEFAULT 'blue';

-- AlterTable: Opportunity.type text -> OpportunityType enum
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "type_tmp" "OpportunityType";
UPDATE "Opportunity" SET "type_tmp" = "type"::"OpportunityType"
  WHERE "type" IN ('research', 'scholarship', 'career', 'competition');
UPDATE "Opportunity" SET "type_tmp" = 'research' WHERE "type_tmp" IS NULL;
ALTER TABLE "Opportunity" DROP COLUMN "type";
ALTER TABLE "Opportunity" RENAME COLUMN "type_tmp" TO "type";
ALTER TABLE "Opportunity" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable: Opportunity.status text -> Status enum
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "status_tmp" "Status";
UPDATE "Opportunity" SET "status_tmp" = "status"::"Status"
  WHERE "status" IN ('active', 'archived', 'upcoming', 'ongoing', 'completed');
UPDATE "Opportunity" SET "status_tmp" = 'active' WHERE "status_tmp" IS NULL;
ALTER TABLE "Opportunity" DROP COLUMN "status";
ALTER TABLE "Opportunity" RENAME COLUMN "status_tmp" TO "status";
ALTER TABLE "Opportunity" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Opportunity" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable: CuratedOpportunity.type text -> OpportunityType enum
ALTER TABLE "CuratedOpportunity" ADD COLUMN IF NOT EXISTS "type_tmp" "OpportunityType";
UPDATE "CuratedOpportunity" SET "type_tmp" = "type"::"OpportunityType"
  WHERE "type" IN ('research', 'scholarship', 'career', 'competition');
UPDATE "CuratedOpportunity" SET "type_tmp" = 'research' WHERE "type_tmp" IS NULL;
ALTER TABLE "CuratedOpportunity" DROP COLUMN "type";
ALTER TABLE "CuratedOpportunity" RENAME COLUMN "type_tmp" TO "type";
ALTER TABLE "CuratedOpportunity" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable: Event.type text -> EventType enum
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "type_tmp" "EventType";
UPDATE "Event" SET "type_tmp" = "type"::"EventType"
  WHERE "type" IN ('bootcamp', 'sandbox');
UPDATE "Event" SET "type_tmp" = 'sandbox' WHERE "type_tmp" IS NULL;
ALTER TABLE "Event" DROP COLUMN "type";
ALTER TABLE "Event" RENAME COLUMN "type_tmp" TO "type";
ALTER TABLE "Event" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable: Event.status -> Status enum
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "status_tmp" "Status";
UPDATE "Event" SET "status_tmp" = "status"::"Status"
  WHERE "status" IN ('active', 'archived', 'upcoming', 'ongoing', 'completed');
UPDATE "Event" SET "status_tmp" = 'upcoming' WHERE "status_tmp" IS NULL;
ALTER TABLE "Event" DROP COLUMN "status";
ALTER TABLE "Event" RENAME COLUMN "status_tmp" TO "status";
ALTER TABLE "Event" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'upcoming';

-- AlterTable: Test.type -> TestType enum
ALTER TABLE "Test" ADD COLUMN IF NOT EXISTS "type_tmp" "TestType";
UPDATE "Test" SET "type_tmp" = "type"::"TestType"
  WHERE "type" IN ('pre', 'post');
UPDATE "Test" SET "type_tmp" = 'pre' WHERE "type_tmp" IS NULL;
ALTER TABLE "Test" DROP COLUMN "type";
ALTER TABLE "Test" RENAME COLUMN "type_tmp" TO "type";
ALTER TABLE "Test" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable: Registration.status -> RegistrationStatus enum
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "status_tmp" "RegistrationStatus";
UPDATE "Registration" SET "status_tmp" = "status"::"RegistrationStatus"
  WHERE "status" IN ('pending', 'confirmed', 'completed', 'cancelled');
UPDATE "Registration" SET "status_tmp" = 'confirmed' WHERE "status_tmp" IS NULL;
ALTER TABLE "Registration" DROP COLUMN "status";
ALTER TABLE "Registration" RENAME COLUMN "status_tmp" TO "status";
ALTER TABLE "Registration" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Registration" ALTER COLUMN "status" SET DEFAULT 'confirmed';

-- AlterTable: Document.type -> DocumentType enum
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "type_tmp" "DocumentType";
UPDATE "Document" SET "type_tmp" = "type"::"DocumentType"
  WHERE "type" IN ('report', 'portfolio', 'proposal');
UPDATE "Document" SET "type_tmp" = 'report' WHERE "type_tmp" IS NULL;
ALTER TABLE "Document" DROP COLUMN "type";
ALTER TABLE "Document" RENAME COLUMN "type_tmp" TO "type";
ALTER TABLE "Document" ALTER COLUMN "type" SET NOT NULL;

-- DropTable: AdminAccount model removed (replaced by User.role)
DROP TABLE IF EXISTS "AdminAccount";