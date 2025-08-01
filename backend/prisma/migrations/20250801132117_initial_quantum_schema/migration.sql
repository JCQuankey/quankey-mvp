-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "webauthnId" TEXT,
    "publicKey" TEXT,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "credentials" JSONB,
    "quantumSeed" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."passwords" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "encryptedNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT DEFAULT 'General',
    "strength" INTEGER NOT NULL DEFAULT 0,
    "encryptedData" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "isQuantum" BOOLEAN NOT NULL DEFAULT false,
    "quantumSource" TEXT,
    "quantumEntropy" TEXT,
    "metadata" JSONB,
    "encryptionVersion" TEXT NOT NULL DEFAULT '1.0',
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "keyDerivation" TEXT NOT NULL DEFAULT 'Argon2id',

    CONSTRAINT "passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shared_vaults" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recovery_kits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sharesTotal" INTEGER NOT NULL,
    "sharesRequired" INTEGER NOT NULL,
    "seedHash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "recovery_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recovery_shares" (
    "id" TEXT NOT NULL,
    "recoveryKitId" TEXT NOT NULL,
    "shareIndex" INTEGER NOT NULL,
    "shareId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',

    CONSTRAINT "recovery_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."share_distributions" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "trusteeEmail" TEXT NOT NULL,
    "trusteeName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "encryptedChannel" JSONB,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_webauthnId_key" ON "public"."users"("webauthnId");

-- CreateIndex
CREATE INDEX "passwords_userId_idx" ON "public"."passwords"("userId");

-- CreateIndex
CREATE INDEX "passwords_site_idx" ON "public"."passwords"("site");

-- CreateIndex
CREATE INDEX "passwords_category_idx" ON "public"."passwords"("category");

-- CreateIndex
CREATE INDEX "passwords_isFavorite_idx" ON "public"."passwords"("isFavorite");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "public"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "public"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "public"."audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "public"."team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "recovery_kits_userId_idx" ON "public"."recovery_kits"("userId");

-- CreateIndex
CREATE INDEX "recovery_kits_isActive_idx" ON "public"."recovery_kits"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_shares_shareId_key" ON "public"."recovery_shares"("shareId");

-- CreateIndex
CREATE INDEX "recovery_shares_recoveryKitId_idx" ON "public"."recovery_shares"("recoveryKitId");

-- CreateIndex
CREATE INDEX "recovery_shares_shareId_idx" ON "public"."recovery_shares"("shareId");

-- CreateIndex
CREATE INDEX "share_distributions_shareId_idx" ON "public"."share_distributions"("shareId");

-- CreateIndex
CREATE INDEX "share_distributions_trusteeEmail_idx" ON "public"."share_distributions"("trusteeEmail");

-- AddForeignKey
ALTER TABLE "public"."passwords" ADD CONSTRAINT "passwords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shared_vaults" ADD CONSTRAINT "shared_vaults_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recovery_kits" ADD CONSTRAINT "recovery_kits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recovery_shares" ADD CONSTRAINT "recovery_shares_recoveryKitId_fkey" FOREIGN KEY ("recoveryKitId") REFERENCES "public"."recovery_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_distributions" ADD CONSTRAINT "share_distributions_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public"."recovery_shares"("shareId") ON DELETE CASCADE ON UPDATE CASCADE;
