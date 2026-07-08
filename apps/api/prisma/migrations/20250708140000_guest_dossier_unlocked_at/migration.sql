-- Align guest dossier unlock with user.dossierUnlockedAt (reliable column vs JSON meta).
ALTER TABLE "guest_sessions" ADD COLUMN "dossierUnlockedAt" TIMESTAMP(3);
