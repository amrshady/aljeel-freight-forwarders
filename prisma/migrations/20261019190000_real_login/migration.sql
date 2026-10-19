PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_User" ("company", "createdAt", "email", "id", "name", "passwordHash", "role")
SELECT "company", "createdAt", "email", "id", "name", '', "role" FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

UPDATE "User" SET "email" = 'procurement@example.test', "name" = 'Test Procurement', "company" = 'Test Company' WHERE "email" = 'procurement@local.test';
UPDATE "User" SET "email" = 'finance@example.test', "name" = 'Test Finance', "company" = 'Test Company' WHERE "email" = 'finance@local.test';
UPDATE "User" SET "email" = 'forwarder-a@example.test', "name" = 'Test Forwarder A', "company" = 'Test Forwarder A' WHERE "email" = 'forwarder-a@local.test';
UPDATE "User" SET "email" = 'forwarder-b@example.test', "name" = 'Test Forwarder B', "company" = 'Test Forwarder B' WHERE "email" = 'forwarder-b@local.test';

CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
