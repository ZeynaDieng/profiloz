-- Persiste le palier d'abonnement actif (illimite | business) et le déblocage dossier invité côté compte.
ALTER TABLE "users" ADD COLUMN "subscriptionPlanSlug" TEXT;
ALTER TABLE "users" ADD COLUMN "dossierUnlockedAt" TIMESTAMP(3);

ALTER TABLE "guest_sessions" ADD COLUMN "subscriptionPlanSlug" TEXT;

-- Rétroactive : abonnés actifs sans palier → Illimité ; dernier paiement Business → Business.
UPDATE "users"
SET "subscriptionPlanSlug" = 'illimite'
WHERE "unlimitedUntil" > NOW() AND "subscriptionPlanSlug" IS NULL;

UPDATE "guest_sessions"
SET "subscriptionPlanSlug" = 'illimite'
WHERE "unlimitedUntil" > NOW() AND "subscriptionPlanSlug" IS NULL;

UPDATE "users" u
SET "subscriptionPlanSlug" = 'business'
FROM "payments" p
WHERE p."userId" = u.id
  AND p.status = 'PAID'
  AND p."planSlug" = 'business'
  AND u."unlimitedUntil" > NOW();

UPDATE "guest_sessions" g
SET "subscriptionPlanSlug" = 'business'
FROM "payments" p
WHERE p."guestSessionId" = g.id
  AND p.status = 'PAID'
  AND p."planSlug" = 'business'
  AND g."unlimitedUntil" > NOW();
