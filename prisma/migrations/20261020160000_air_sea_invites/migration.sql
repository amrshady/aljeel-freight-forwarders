PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "shipper" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "goods" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'AIR',
    "cartons" INTEGER,
    "actualWeightKg" REAL,
    "lengthCm" REAL,
    "widthCm" REAL,
    "heightCm" REAL,
    "containerType" TEXT,
    "containerCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Shipment" ("id", "reference", "shipper", "origin", "destination", "goods", "mode", "cartons", "actualWeightKg", "lengthCm", "widthCm", "heightCm", "status", "createdById", "createdAt")
SELECT "id", "reference", "shipper", "origin", "destination", "goods", 'AIR', "cartons", "actualWeightKg", "lengthCm", "widthCm", "heightCm", "status", "createdById", "createdAt" FROM "Shipment";

DROP TABLE "Shipment";
ALTER TABLE "new_Shipment" RENAME TO "Shipment";
CREATE UNIQUE INDEX "Shipment_reference_key" ON "Shipment"("reference");

CREATE TABLE "ShipmentInvite" (
    "shipmentId" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    CONSTRAINT "ShipmentInvite_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShipmentInvite_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("shipmentId", "forwarderId")
);

INSERT INTO "ShipmentInvite" ("shipmentId", "forwarderId")
SELECT "Shipment"."id", "User"."id" FROM "Shipment" CROSS JOIN "User" WHERE "User"."role" = 'FORWARDER';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
