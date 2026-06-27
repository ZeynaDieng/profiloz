-- AlterTable: pays distinct de la ville + compétences mobilisées par expérience
ALTER TABLE "experiences" ADD COLUMN "country" TEXT;
ALTER TABLE "experiences" ADD COLUMN "skillsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[];
