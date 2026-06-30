-- CreateEnum
CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'fr-FR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr-FR',
    "content" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'OTHER',
    "alt" TEXT,
    "folderId" TEXT,
    "uploadedById" TEXT,
    "publicUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverMediaId" TEXT,
    "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_locale_isActive_sortOrder_idx" ON "faq_items"("locale", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "landing_sections_key_locale_key" ON "landing_sections"("key", "locale");

-- CreateIndex
CREATE INDEX "media_folders_parentId_idx" ON "media_folders"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_folderId_idx" ON "media_assets"("folderId");

-- CreateIndex
CREATE INDEX "media_assets_kind_idx" ON "media_assets"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed FAQ
INSERT INTO "faq_items" ("id", "question", "answer", "sortOrder", "locale", "isActive", "createdAt", "updatedAt") VALUES
('faq_seed_1', 'Comment fonctionne l''import de documents ?', 'Notre moteur lit les fichiers PDF et DOCX, identifie expériences, formations et compétences, puis les place dans les champs correspondants de l''éditeur.', 0, 'fr-FR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_seed_2', 'Les recruteurs pourront-ils lire mon CV ?', 'Oui. Chaque modèle est testé pour garantir une excellente lisibilité humaine et une compatibilité avec les principaux ATS du marché.', 1, 'fr-FR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_seed_3', 'Puis-je créer une lettre de motivation ?', 'Oui. Profilo''Z permet de rédiger et personnaliser des lettres de motivation, puis de les exporter en PDF. La création de lettres nécessite un compte gratuit pour les sauvegarder et les modifier.', 2, 'fr-FR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('faq_seed_4', 'Puis-je télécharger mon CV en PDF ?', 'Oui, vous pouvez exporter votre CV en PDF haute qualité sans inscription. Un compte permet aussi de sauvegarder CV et lettres.', 3, 'fr-FR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Landing sections
INSERT INTO "landing_sections" ("id", "key", "locale", "content", "isActive", "updatedAt") VALUES
('landing_hero', 'hero', 'fr-FR', '{"titleTransform":"Créez votre CV et votre lettre de motivation en quelques minutes.","titleStart":"Tout ce qu''il faut pour réussir votre candidature.","subtitle":"Profilo''Z réunit CV, lettres de motivation, modèles professionnels et export PDF. L''ensemble de votre dossier de candidature, au même endroit.","ctaPrimary":"Commencer gratuitement","ctaPrimaryLink":"/creer","ctaSecondary":"Créer une lettre","ctaSecondaryLink":"/creer/lettre","trustLine":"CV et lettre sans inscription · PDF immédiat · Compatible ATS","journeySteps":["CV ou lettre","Choisir un modèle","Exporter en PDF"]}', true, CURRENT_TIMESTAMP),
('landing_features', 'features', 'fr-FR', '{"title":"Tout pour votre candidature","items":[{"icon":"auto_awesome","title":"Import intelligent","description":"PDF et DOCX analysés automatiquement."},{"icon":"view_quilt","title":"Modèles pro","description":"CV et lettres harmonisés, compatibles ATS."},{"icon":"picture_as_pdf","title":"Export PDF","description":"Téléchargement immédiat, haute qualité."},{"icon":"groups","title":"Mode Business","description":"Gérez les dossiers de votre équipe."}]}', true, CURRENT_TIMESTAMP),
('landing_testimonials', 'testimonials', 'fr-FR', '{"items":[{"quote":"J''ai créé mon CV en 10 minutes. Le modèle est impeccable.","author":"Aminata D.","role":"Étudiante"},{"quote":"Nos étudiants gagnent un temps précieux avec Profilo''Z.","author":"Moussa K.","role":"Responsable carrières"},{"quote":"Simple, rapide, professionnel. Exactement ce qu''il me fallait.","author":"Fatou S.","role":"Commerciale"}]}', true, CURRENT_TIMESTAMP),
('landing_reassurance', 'reassurance', 'fr-FR', '{"stats":[{"end":12000,"suffix":"+","label":"CV créés"},{"end":8,"suffix":" min","label":"Temps moyen"},{"end":100,"suffix":"%","label":"Compatible ATS"},{"end":24,"suffix":"/7","label":"Disponible"}],"items":[{"icon":"verified_user","title":"Compatible ATS","description":"Modèles structurés pour les logiciels de recrutement."},{"icon":"person_off","title":"Sans inscription","description":"CV en mode invité. Compte gratuit pour sauvegarder."},{"icon":"bolt","title":"PDF immédiat","description":"Téléchargez vos documents en quelques minutes."},{"icon":"lock","title":"Données sécurisées","description":"Vos informations protégées et conservées de manière responsable."}]}', true, CURRENT_TIMESTAMP),
('landing_cta', 'cta', 'fr-FR', '{"title":"Votre prochaine opportunité commence ici","subtitle":"Rejoignez des milliers de candidats qui ont transformé leur recherche d''emploi avec Profilo''Z.","ctaPrimary":"Commencer gratuitement","ctaPrimaryLink":"/creer","traditional":["Word compliqué","Mise en page manuelle","CV et lettre séparés","Problèmes ATS"],"profiloz":["Création guidée","CV + lettre au même endroit","Modèles modernes","Export PDF immédiat"]}', true, CURRENT_TIMESTAMP);

-- Default media folder
INSERT INTO "media_folders" ("id", "name", "parentId", "createdAt") VALUES
('folder_root', 'Bibliothèque', NULL, CURRENT_TIMESTAMP);
