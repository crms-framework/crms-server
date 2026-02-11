-- CreateTable
CREATE TABLE "officers" (
    "id" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "nationalId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "pinHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrollmentDate" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "pinChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaBackupCodes" TEXT[],
    "photoUrl" TEXT,
    "photoFileKey" TEXT,
    "photoThumbnailUrl" TEXT,
    "photoSmallUrl" TEXT,
    "photoMediumUrl" TEXT,
    "photoHash" TEXT,
    "photoSize" INTEGER,
    "photoUploadedAt" TIMESTAMP(3),
    "ussdPhoneNumber" TEXT,
    "ussdQuickPinHash" TEXT,
    "ussdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ussdRegisteredAt" TIMESTAMP(3),
    "ussdLastUsed" TIMESTAMP(3),
    "ussdDailyLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT,
    "region" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SLE',
    "phone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT,
    "idType" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'SLE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "fullName" TEXT,
    "aliases" TEXT[],
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'SLE',
    "addressEncrypted" TEXT,
    "phoneEncrypted" TEXT,
    "emailEncrypted" TEXT,
    "photoUrl" TEXT,
    "photoFileKey" TEXT,
    "photoThumbnailUrl" TEXT,
    "photoSmallUrl" TEXT,
    "photoMediumUrl" TEXT,
    "photoHash" TEXT,
    "photoSize" INTEGER,
    "photoUploadedAt" TIMESTAMP(3),
    "fingerprintHash" TEXT,
    "biometricHash" TEXT,
    "isWanted" BOOLEAN NOT NULL DEFAULT false,
    "wantedSince" TIMESTAMP(3),
    "isDeceasedOrMissing" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ward" TEXT,
    "district" TEXT,
    "stationId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_persons" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "statement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_evidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "case_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "officerId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_note_redactions" (
    "id" TEXT NOT NULL,
    "caseNoteId" TEXT NOT NULL,
    "redactedById" TEXT NOT NULL,
    "redactionReason" TEXT NOT NULL,
    "redactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_note_redactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "qrCode" TEXT NOT NULL,
    "storageUrl" TEXT,
    "fileKey" TEXT,
    "fileHash" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "collectedDate" TIMESTAMP(3) NOT NULL,
    "collectedById" TEXT NOT NULL,
    "collectedLocation" TEXT,
    "stationId" TEXT NOT NULL,
    "storageLocation" TEXT,
    "isSealed" BOOLEAN NOT NULL DEFAULT false,
    "sealedAt" TIMESTAMP(3),
    "sealedBy" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'collected',
    "notes" TEXT,
    "chainOfCustody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amber_alerts" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "photoFileKey" TEXT,
    "photoThumbnailUrl" TEXT,
    "photoSmallUrl" TEXT,
    "photoMediumUrl" TEXT,
    "photoHash" TEXT,
    "photoSize" INTEGER,
    "photoUploadedAt" TIMESTAMP(3),
    "lastSeenLocation" TEXT,
    "lastSeenDate" TIMESTAMP(3),
    "contactPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amber_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wanted_persons" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "charges" TEXT[],
    "photoUrl" TEXT,
    "photoFileKey" TEXT,
    "photoThumbnailUrl" TEXT,
    "photoSmallUrl" TEXT,
    "photoMediumUrl" TEXT,
    "photoHash" TEXT,
    "photoSize" INTEGER,
    "photoUploadedAt" TIMESTAMP(3),
    "description" TEXT,
    "reward" DECIMAL(10,2),
    "dangerLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "warrantNumber" TEXT,
    "lastSeenLocation" TEXT,
    "lastSeenDate" TIMESTAMP(3),
    "regionalAlert" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "publishedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "capturedLocation" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wanted_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_checks" (
    "id" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "requestedById" TEXT,
    "requestType" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "phoneNumber" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "officerId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "stationId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ussd_query_logs" (
    "id" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "resultSummary" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ussd_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "ownerNIN" TEXT,
    "ownerName" TEXT,
    "vehicleType" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stolenDate" TIMESTAMP(3),
    "stolenReportedBy" TEXT,
    "recoveredDate" TIMESTAMP(3),
    "notes" TEXT,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "officerId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'MAIN_MENU',
    "selectedQueryType" TEXT,
    "searchTerm" TEXT,
    "queryData" JSONB,
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_newsletters" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pictureUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriberCount" INTEGER DEFAULT 0,
    "reactionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "framework_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "framework_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offense_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_ranks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_crime_aggregates" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_crime_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiKeyPrefix" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB NOT NULL,
    "ipWhitelist" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interagency_requests" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestData" JSONB NOT NULL,
    "responseData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "ipAddress" TEXT,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interagency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_webhooks" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_import_jobs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileName" TEXT,
    "fileKey" TEXT NOT NULL,
    "duplicateStrategy" TEXT NOT NULL DEFAULT 'skip',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "summary" JSONB,
    "officerId" TEXT NOT NULL,
    "stationId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "officers_badge_key" ON "officers"("badge");

-- CreateIndex
CREATE UNIQUE INDEX "officers_nationalId_key" ON "officers"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "officers_email_key" ON "officers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "officers_ussdPhoneNumber_key" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE INDEX "officers_badge_idx" ON "officers"("badge");

-- CreateIndex
CREATE INDEX "officers_nationalId_idx" ON "officers"("nationalId");

-- CreateIndex
CREATE INDEX "officers_stationId_idx" ON "officers"("stationId");

-- CreateIndex
CREATE INDEX "officers_roleId_idx" ON "officers"("roleId");

-- CreateIndex
CREATE INDEX "officers_ussdPhoneNumber_idx" ON "officers"("ussdPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_officerId_idx" ON "sessions"("officerId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_level_key" ON "roles"("level");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_scope_key" ON "permissions"("resource", "action", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_code_idx" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_region_idx" ON "stations"("region");

-- CreateIndex
CREATE INDEX "stations_countryCode_idx" ON "stations"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "persons_nationalId_key" ON "persons"("nationalId");

-- CreateIndex
CREATE INDEX "persons_nationalId_idx" ON "persons"("nationalId");

-- CreateIndex
CREATE INDEX "persons_firstName_lastName_idx" ON "persons"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "persons_countryCode_idx" ON "persons"("countryCode");

-- CreateIndex
CREATE INDEX "persons_createdById_idx" ON "persons"("createdById");

-- CreateIndex
CREATE INDEX "persons_isWanted_idx" ON "persons"("isWanted");

-- CreateIndex
CREATE INDEX "persons_riskLevel_idx" ON "persons"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_caseNumber_idx" ON "cases"("caseNumber");

-- CreateIndex
CREATE INDEX "cases_stationId_idx" ON "cases"("stationId");

-- CreateIndex
CREATE INDEX "cases_officerId_idx" ON "cases"("officerId");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_category_idx" ON "cases"("category");

-- CreateIndex
CREATE INDEX "cases_incidentDate_idx" ON "cases"("incidentDate");

-- CreateIndex
CREATE INDEX "cases_latitude_longitude_idx" ON "cases"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "cases_district_idx" ON "cases"("district");

-- CreateIndex
CREATE INDEX "case_persons_caseId_idx" ON "case_persons"("caseId");

-- CreateIndex
CREATE INDEX "case_persons_personId_idx" ON "case_persons"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "case_persons_caseId_personId_role_key" ON "case_persons"("caseId", "personId", "role");

-- CreateIndex
CREATE INDEX "case_evidence_caseId_idx" ON "case_evidence"("caseId");

-- CreateIndex
CREATE INDEX "case_evidence_evidenceId_idx" ON "case_evidence"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "case_evidence_caseId_evidenceId_key" ON "case_evidence"("caseId", "evidenceId");

-- CreateIndex
CREATE INDEX "case_notes_caseId_idx" ON "case_notes"("caseId");

-- CreateIndex
CREATE INDEX "case_notes_officerId_idx" ON "case_notes"("officerId");

-- CreateIndex
CREATE UNIQUE INDEX "case_note_redactions_caseNoteId_key" ON "case_note_redactions"("caseNoteId");

-- CreateIndex
CREATE INDEX "case_note_redactions_caseNoteId_idx" ON "case_note_redactions"("caseNoteId");

-- CreateIndex
CREATE INDEX "case_note_redactions_redactedById_idx" ON "case_note_redactions"("redactedById");

-- CreateIndex
CREATE INDEX "case_note_redactions_redactedAt_idx" ON "case_note_redactions"("redactedAt");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_qrCode_key" ON "evidence"("qrCode");

-- CreateIndex
CREATE INDEX "evidence_qrCode_idx" ON "evidence"("qrCode");

-- CreateIndex
CREATE INDEX "evidence_collectedById_idx" ON "evidence"("collectedById");

-- CreateIndex
CREATE INDEX "evidence_stationId_idx" ON "evidence"("stationId");

-- CreateIndex
CREATE INDEX "evidence_status_idx" ON "evidence"("status");

-- CreateIndex
CREATE INDEX "amber_alerts_status_idx" ON "amber_alerts"("status");

-- CreateIndex
CREATE INDEX "amber_alerts_createdById_idx" ON "amber_alerts"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "wanted_persons_personId_key" ON "wanted_persons"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "wanted_persons_warrantNumber_key" ON "wanted_persons"("warrantNumber");

-- CreateIndex
CREATE INDEX "wanted_persons_status_idx" ON "wanted_persons"("status");

-- CreateIndex
CREATE INDEX "wanted_persons_personId_idx" ON "wanted_persons"("personId");

-- CreateIndex
CREATE INDEX "wanted_persons_createdById_idx" ON "wanted_persons"("createdById");

-- CreateIndex
CREATE INDEX "background_checks_nin_idx" ON "background_checks"("nin");

-- CreateIndex
CREATE INDEX "background_checks_requestedById_idx" ON "background_checks"("requestedById");

-- CreateIndex
CREATE INDEX "background_checks_phoneNumber_idx" ON "background_checks"("phoneNumber");

-- CreateIndex
CREATE INDEX "background_checks_createdAt_idx" ON "background_checks"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_officerId_idx" ON "audit_logs"("officerId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "sync_queue_status_idx" ON "sync_queue"("status");

-- CreateIndex
CREATE INDEX "sync_queue_createdAt_idx" ON "sync_queue"("createdAt");

-- CreateIndex
CREATE INDEX "ussd_query_logs_officerId_idx" ON "ussd_query_logs"("officerId");

-- CreateIndex
CREATE INDEX "ussd_query_logs_timestamp_idx" ON "ussd_query_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ussd_query_logs_queryType_idx" ON "ussd_query_logs"("queryType");

-- CreateIndex
CREATE INDEX "ussd_query_logs_phoneNumber_idx" ON "ussd_query_logs"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_ownerNIN_idx" ON "vehicles"("ownerNIN");

-- CreateIndex
CREATE INDEX "vehicles_stationId_idx" ON "vehicles"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_phoneNumber_key" ON "whatsapp_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_phoneNumber_idx" ON "whatsapp_sessions"("phoneNumber");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_officerId_idx" ON "whatsapp_sessions"("officerId");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_expiresAt_idx" ON "whatsapp_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_newsletters_channelId_key" ON "whatsapp_newsletters"("channelId");

-- CreateIndex
CREATE INDEX "whatsapp_newsletters_channelId_idx" ON "whatsapp_newsletters"("channelId");

-- CreateIndex
CREATE INDEX "whatsapp_newsletters_createdById_idx" ON "whatsapp_newsletters"("createdById");

-- CreateIndex
CREATE INDEX "whatsapp_newsletters_status_idx" ON "whatsapp_newsletters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "framework_config_key_key" ON "framework_config"("key");

-- CreateIndex
CREATE INDEX "framework_config_category_idx" ON "framework_config"("category");

-- CreateIndex
CREATE INDEX "framework_config_key_idx" ON "framework_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "offense_categories_code_key" ON "offense_categories"("code");

-- CreateIndex
CREATE INDEX "offense_categories_parentId_idx" ON "offense_categories"("parentId");

-- CreateIndex
CREATE INDEX "offense_categories_code_idx" ON "offense_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "police_ranks_level_key" ON "police_ranks"("level");

-- CreateIndex
CREATE INDEX "police_ranks_level_idx" ON "police_ranks"("level");

-- CreateIndex
CREATE INDEX "geo_crime_aggregates_region_idx" ON "geo_crime_aggregates"("region");

-- CreateIndex
CREATE INDEX "geo_crime_aggregates_period_idx" ON "geo_crime_aggregates"("period");

-- CreateIndex
CREATE INDEX "geo_crime_aggregates_category_idx" ON "geo_crime_aggregates"("category");

-- CreateIndex
CREATE UNIQUE INDEX "geo_crime_aggregates_region_category_period_periodType_key" ON "geo_crime_aggregates"("region", "category", "period", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_name_key" ON "agencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_apiKey_key" ON "agencies"("apiKey");

-- CreateIndex
CREATE INDEX "agencies_apiKey_idx" ON "agencies"("apiKey");

-- CreateIndex
CREATE INDEX "agencies_type_idx" ON "agencies"("type");

-- CreateIndex
CREATE INDEX "interagency_requests_agencyId_idx" ON "interagency_requests"("agencyId");

-- CreateIndex
CREATE INDEX "interagency_requests_requestType_idx" ON "interagency_requests"("requestType");

-- CreateIndex
CREATE INDEX "interagency_requests_createdAt_idx" ON "interagency_requests"("createdAt");

-- CreateIndex
CREATE INDEX "agency_webhooks_agencyId_idx" ON "agency_webhooks"("agencyId");

-- CreateIndex
CREATE INDEX "agency_webhooks_event_idx" ON "agency_webhooks"("event");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_status_idx" ON "bulk_import_jobs"("status");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_officerId_idx" ON "bulk_import_jobs"("officerId");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_entityType_idx" ON "bulk_import_jobs"("entityType");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "officers" ADD CONSTRAINT "officers_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officers" ADD CONSTRAINT "officers_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_persons" ADD CONSTRAINT "case_persons_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_note_redactions" ADD CONSTRAINT "case_note_redactions_caseNoteId_fkey" FOREIGN KEY ("caseNoteId") REFERENCES "case_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_note_redactions" ADD CONSTRAINT "case_note_redactions_redactedById_fkey" FOREIGN KEY ("redactedById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amber_alerts" ADD CONSTRAINT "amber_alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wanted_persons" ADD CONSTRAINT "wanted_persons_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wanted_persons" ADD CONSTRAINT "wanted_persons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ussd_query_logs" ADD CONSTRAINT "ussd_query_logs_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "officers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_newsletters" ADD CONSTRAINT "whatsapp_newsletters_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offense_categories" ADD CONSTRAINT "offense_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "offense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interagency_requests" ADD CONSTRAINT "interagency_requests_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_webhooks" ADD CONSTRAINT "agency_webhooks_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
