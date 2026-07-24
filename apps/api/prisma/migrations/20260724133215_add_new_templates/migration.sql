-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TemplateSlug" ADD VALUE 'TECH_LEAD';
ALTER TYPE "TemplateSlug" ADD VALUE 'ELEGANCE';
ALTER TYPE "TemplateSlug" ADD VALUE 'IMPACT';
ALTER TYPE "TemplateSlug" ADD VALUE 'CABINET';
ALTER TYPE "TemplateSlug" ADD VALUE 'ACADEMIQUE';
ALTER TYPE "TemplateSlug" ADD VALUE 'ATELIER';
ALTER TYPE "TemplateSlug" ADD VALUE 'CLINIQUE';
ALTER TYPE "TemplateSlug" ADD VALUE 'DUOTONE';
ALTER TYPE "TemplateSlug" ADD VALUE 'CHRONOS';
ALTER TYPE "TemplateSlug" ADD VALUE 'ATS_FRIENDLY';
