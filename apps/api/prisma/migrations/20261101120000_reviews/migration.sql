DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "guestSessionId" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "city" TEXT,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "moderatedAt" TIMESTAMP(3),
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_userId_key" ON "reviews"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_guestSessionId_key" ON "reviews"("guestSessionId");
CREATE INDEX IF NOT EXISTS "reviews_status_createdAt_idx" ON "reviews"("status", "createdAt");
