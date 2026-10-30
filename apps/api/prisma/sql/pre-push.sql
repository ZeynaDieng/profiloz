-- Exécuté avant `prisma db push` (docker/entrypoint-api.sh). Idempotent.
-- db push remplacerait l'enum TemplateSlug par du TEXT en supprimant puis recréant les colonnes
-- (tous les CV reviendraient au modèle par défaut) : on convertit d'abord en conservant les valeurs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TemplateSlug') THEN
    ALTER TABLE "resumes" ALTER COLUMN "templateSlug" DROP DEFAULT;
    ALTER TABLE "resumes" ALTER COLUMN "templateSlug" TYPE TEXT USING "templateSlug"::text;
    ALTER TABLE "resumes" ALTER COLUMN "templateSlug" SET DEFAULT 'PROFESSIONNEL';
    ALTER TABLE "templates" ALTER COLUMN "slug" TYPE TEXT USING "slug"::text;
    DROP TYPE "TemplateSlug";
  END IF;
END $$;
