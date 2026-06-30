-- AlterTable
ALTER TABLE "users" ADD COLUMN "suspendedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('ALL', 'BUSINESS', 'PREMIUM');

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_slug_key" ON "email_templates"("slug");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actorId_idx" ON "admin_audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "platform_notifications_createdAt_idx" ON "platform_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default email templates
INSERT INTO "email_templates" ("id", "slug", "name", "description", "subject", "bodyHtml", "bodyText", "isActive", "updatedAt")
VALUES
  ('email_welcome', 'welcome', 'Email de bienvenue', 'Envoyé après inscription.', 'Bienvenue sur Profilo''Z', '<p>Bienvenue sur Profilo''Z ! Votre compte est prêt.</p>', 'Bienvenue sur Profilo''Z ! Votre compte est prêt.', true, CURRENT_TIMESTAMP),
  ('email_payment', 'payment_receipt', 'Reçu de paiement', 'Confirmation après paiement réussi.', 'Votre paiement Profilo''Z', '<p>Merci pour votre paiement. Votre dossier est débloqué.</p>', 'Merci pour votre paiement. Votre dossier est débloqué.', true, CURRENT_TIMESTAMP),
  ('email_reset', 'password_reset', 'Réinitialisation du mot de passe', 'Lien de réinitialisation.', 'Réinitialisez votre mot de passe Profilo''Z', '<p>Utilisez le lien reçu pour choisir un nouveau mot de passe.</p>', 'Utilisez le lien reçu pour choisir un nouveau mot de passe.', true, CURRENT_TIMESTAMP),
  ('email_order', 'order_confirmation', 'Confirmation de commande', 'Récapitulatif de commande.', 'Confirmation de commande Profilo''Z', '<p>Votre commande a bien été enregistrée.</p>', 'Votre commande a bien été enregistrée.', true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
