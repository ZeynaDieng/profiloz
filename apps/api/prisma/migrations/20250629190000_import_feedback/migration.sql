-- Télémétrie des corrections post-import (amélioration continue du moteur OCR).
CREATE TABLE "import_feedback" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "templateSlug" TEXT,
    "originalParsed" JSONB NOT NULL,
    "correctedData" JSONB NOT NULL,
    "fieldDiffs" JSONB NOT NULL,
    "overallConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_feedback_createdAt_idx" ON "import_feedback"("createdAt");
CREATE INDEX "import_feedback_documentId_idx" ON "import_feedback"("documentId");
