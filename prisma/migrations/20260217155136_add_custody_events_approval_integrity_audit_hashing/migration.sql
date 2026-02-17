-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "entryHash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- CreateTable
CREATE TABLE "custody_events" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "notes" TEXT,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custody_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_approvals" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "pending_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrity_reports" (
    "id" TEXT NOT NULL,
    "anonymousToken" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceLog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolution" TEXT,
    "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custody_events_evidenceId_idx" ON "custody_events"("evidenceId");

-- CreateIndex
CREATE INDEX "custody_events_officerId_idx" ON "custody_events"("officerId");

-- CreateIndex
CREATE INDEX "pending_approvals_requestedById_idx" ON "pending_approvals"("requestedById");

-- CreateIndex
CREATE INDEX "pending_approvals_status_idx" ON "pending_approvals"("status");

-- CreateIndex
CREATE INDEX "pending_approvals_expiresAt_idx" ON "pending_approvals"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "integrity_reports_anonymousToken_key" ON "integrity_reports"("anonymousToken");

-- CreateIndex
CREATE INDEX "integrity_reports_anonymousToken_idx" ON "integrity_reports"("anonymousToken");

-- CreateIndex
CREATE INDEX "integrity_reports_status_idx" ON "integrity_reports"("status");

-- CreateIndex
CREATE INDEX "integrity_reports_category_idx" ON "integrity_reports"("category");

-- CreateIndex
CREATE INDEX "audit_logs_entryHash_idx" ON "audit_logs"("entryHash");

-- AddForeignKey
ALTER TABLE "custody_events" ADD CONSTRAINT "custody_events_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custody_events" ADD CONSTRAINT "custody_events_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_approvals" ADD CONSTRAINT "pending_approvals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrity_reports" ADD CONSTRAINT "integrity_reports_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
