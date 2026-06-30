-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_userId_createdAt_idx" ON "user_notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update email templates with variables
UPDATE "email_templates" SET
  "subject" = 'Bienvenue sur Profilo''Z, {{firstName}}',
  "bodyHtml" = '<p>Bonjour {{firstName}},</p><p>Bienvenue sur Profilo''Z ! Votre compte <strong>{{email}}</strong> est prêt.</p>',
  "bodyText" = 'Bonjour {{firstName}}, bienvenue sur Profilo''Z ! Votre compte {{email}} est prêt.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'welcome';

UPDATE "email_templates" SET
  "subject" = 'Reçu Profilo''Z — {{planName}}',
  "bodyHtml" = '<p>Merci {{firstName}} !</p><p>Votre paiement de <strong>{{amount}}</strong> pour l''offre {{planName}} a bien été enregistré.</p>',
  "bodyText" = 'Merci {{firstName}} ! Paiement de {{amount}} pour {{planName}} confirmé.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'payment_receipt';

UPDATE "email_templates" SET
  "subject" = 'Votre mot de passe temporaire Profilo''Z',
  "bodyHtml" = '<p>Bonjour,</p><p>Votre mot de passe temporaire : <strong>{{temporaryPassword}}</strong></p><p>Connectez-vous puis changez-le dans vos paramètres.</p>',
  "bodyText" = 'Mot de passe temporaire : {{temporaryPassword}}',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'password_reset';
