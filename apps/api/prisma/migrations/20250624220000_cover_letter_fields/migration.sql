-- AlterTable
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "senderPhone" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "senderLocation" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "closingText" TEXT;

ALTER TABLE "cover_letters" ALTER COLUMN "templateId" SET DEFAULT 'CLASSIQUE';

UPDATE "cover_letters" SET "templateId" = 'CLASSIQUE' WHERE "templateId" = 'classic';
