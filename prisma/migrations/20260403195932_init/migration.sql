-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "distanceUnit" TEXT NOT NULL DEFAULT 'kilometers',
    "fuelUnit" TEXT NOT NULL DEFAULT 'liters',
    "temperatureUnit" TEXT NOT NULL DEFAULT 'celsius',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "maintenanceReminders" BOOLEAN NOT NULL DEFAULT true,
    "serviceDueAlerts" BOOLEAN NOT NULL DEFAULT true,
    "promotionalOffers" BOOLEAN NOT NULL DEFAULT true,
    "diagnosticAlerts" BOOLEAN NOT NULL DEFAULT true,
    "allowAnonymousData" BOOLEAN NOT NULL DEFAULT false,
    "allowAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "allowThirdPartyData" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
    "transactionalEmails" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "licensePlate" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "healthScore" INTEGER DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueInKm" INTEGER,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_items_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mileageAtService" INTEGER NOT NULL,
    "shopName" TEXT,
    "cost" REAL,
    "currency" TEXT DEFAULT 'USD',
    "receiptUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "liters" REAL NOT NULL,
    "costPerLiter" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "mileageAtFill" INTEGER NOT NULL,
    "station" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fuel_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosisCard" TEXT,
    "imageUrl" TEXT,
    "sessionId" TEXT,
    CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "distanceKm" REAL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "closingTime" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "specialties" TEXT NOT NULL,
    "description" TEXT,
    "hours" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "terms" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "offers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "offer_claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offer_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "offer_claims_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");

-- CreateIndex
CREATE INDEX "maintenance_items_vehicleId_idx" ON "maintenance_items"("vehicleId");

-- CreateIndex
CREATE INDEX "maintenance_items_status_idx" ON "maintenance_items"("status");

-- CreateIndex
CREATE INDEX "service_records_vehicleId_idx" ON "service_records"("vehicleId");

-- CreateIndex
CREATE INDEX "service_records_date_idx" ON "service_records"("date");

-- CreateIndex
CREATE INDEX "fuel_logs_vehicleId_idx" ON "fuel_logs"("vehicleId");

-- CreateIndex
CREATE INDEX "fuel_logs_date_idx" ON "fuel_logs"("date");

-- CreateIndex
CREATE INDEX "chat_messages_userId_sessionId_idx" ON "chat_messages"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "shops_latitude_longitude_idx" ON "shops"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "offers_shopId_idx" ON "offers"("shopId");

-- CreateIndex
CREATE INDEX "offers_validUntil_idx" ON "offers"("validUntil");

-- CreateIndex
CREATE INDEX "offers_isActive_idx" ON "offers"("isActive");

-- CreateIndex
CREATE INDEX "offer_claims_userId_idx" ON "offer_claims"("userId");

-- CreateIndex
CREATE INDEX "offer_claims_offerId_idx" ON "offer_claims"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_claims_userId_offerId_key" ON "offer_claims"("userId", "offerId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");
