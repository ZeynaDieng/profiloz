-- AlterTable: crédits sur la session invitée
ALTER TABLE "guest_sessions" ADD COLUMN "creditsBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "guest_sessions" ADD COLUMN "unlimitedUntil" TIMESTAMP(3);

-- AlterTable: paiement attribuable à un invité (userId devient optionnel)
ALTER TABLE "payments" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "guestSessionId" TEXT;

-- CreateIndex
CREATE INDEX "payments_guestSessionId_idx" ON "payments"("guestSessionId");
CREATE INDEX "resumes_guestSessionId_idx" ON "resumes"("guestSessionId");

-- AddForeignKey: resumes.guestSessionId -> guest_sessions
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: payments.guestSessionId -> guest_sessions
ALTER TABLE "payments" ADD CONSTRAINT "payments_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
