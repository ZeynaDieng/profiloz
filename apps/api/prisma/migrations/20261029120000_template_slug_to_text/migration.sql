-- Les slugs de modèle deviennent du texte validé côté code (catalogue @profiloz/shared) :
-- ajouter un modèle ne demande plus de migration.
ALTER TABLE "resumes" ALTER COLUMN "templateSlug" DROP DEFAULT;
ALTER TABLE "resumes" ALTER COLUMN "templateSlug" TYPE TEXT USING "templateSlug"::text;
ALTER TABLE "resumes" ALTER COLUMN "templateSlug" SET DEFAULT 'PROFESSIONNEL';

ALTER TABLE "templates" ALTER COLUMN "slug" TYPE TEXT USING "slug"::text;

DROP TYPE "TemplateSlug";
