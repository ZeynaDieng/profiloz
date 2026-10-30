-- signatureUrl existait dans le schéma sans migration (la production utilise db push) : IF NOT EXISTS
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "unlockedAt" TIMESTAMP(3);
