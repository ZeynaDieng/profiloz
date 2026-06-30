-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'SCHOOL', 'UNIVERSITY', 'RH_AGENCY', 'TRAINING_CENTER', 'OTHER');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'OTHER',
    "unlimitedUntil" TIMESTAMP(3),
    "subscriptionPlanSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "resumes" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "documents" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "payments" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN "organizationId" TEXT;

CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");
CREATE INDEX "resumes_organizationId_idx" ON "resumes"("organizationId");
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");
CREATE INDEX "payments_organizationId_idx" ON "payments"("organizationId");
CREATE INDEX "cover_letters_organizationId_idx" ON "cover_letters"("organizationId");

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rétroactive : créer une organisation Business pour chaque abonné Business actif sans org.
INSERT INTO "organizations" ("id", "name", "type", "unlimitedUntil", "subscriptionPlanSlug", "createdAt", "updatedAt")
SELECT
  'org_' || u."id",
  COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u."firstName", ''), ' ', COALESCE(u."lastName", ''))), ''), split_part(u."email", '@', 1)) || ' — Organisation',
  'OTHER',
  u."unlimitedUntil",
  'business',
  NOW(),
  NOW()
FROM "users" u
WHERE u."unlimitedUntil" > NOW()
  AND u."subscriptionPlanSlug" = 'business'
  AND NOT EXISTS (
    SELECT 1 FROM "organization_members" m WHERE m."userId" = u."id"
  );

INSERT INTO "organization_members" ("id", "organizationId", "userId", "role", "joinedAt")
SELECT
  'mbr_' || u."id",
  'org_' || u."id",
  u."id",
  'OWNER',
  NOW()
FROM "users" u
WHERE u."unlimitedUntil" > NOW()
  AND u."subscriptionPlanSlug" = 'business'
  AND NOT EXISTS (
    SELECT 1 FROM "organization_members" m WHERE m."userId" = u."id"
  );

-- Rattacher les dossiers existants des owners à leur organisation.
UPDATE "resumes" r
SET "organizationId" = m."organizationId"
FROM "organization_members" m
WHERE r."userId" = m."userId"
  AND m."role" = 'OWNER'
  AND r."organizationId" IS NULL;

UPDATE "documents" d
SET "organizationId" = m."organizationId"
FROM "organization_members" m
WHERE d."userId" = m."userId"
  AND m."role" = 'OWNER'
  AND d."organizationId" IS NULL;

UPDATE "cover_letters" c
SET "organizationId" = m."organizationId"
FROM "organization_members" m
WHERE c."userId" = m."userId"
  AND m."role" = 'OWNER'
  AND c."organizationId" IS NULL;
