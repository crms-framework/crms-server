-- CreateIndex: Analytics optimization for Case model
-- Composite indexes for groupBy queries with stationId filter
CREATE INDEX "cases_stationId_status_idx" ON "cases"("stationId", "status");
CREATE INDEX "cases_stationId_category_idx" ON "cases"("stationId", "category");
CREATE INDEX "cases_stationId_severity_idx" ON "cases"("stationId", "severity");
CREATE INDEX "cases_stationId_updatedAt_status_idx" ON "cases"("stationId", "updatedAt", "status");

-- CreateIndex: Analytics optimization for Evidence model
-- Composite indexes for groupBy queries with stationId filter
CREATE INDEX "evidence_stationId_status_idx" ON "evidence"("stationId", "status");
CREATE INDEX "evidence_stationId_type_idx" ON "evidence"("stationId", "type");
CREATE INDEX "evidence_stationId_storageUrl_idx" ON "evidence"("stationId", "storageUrl");
