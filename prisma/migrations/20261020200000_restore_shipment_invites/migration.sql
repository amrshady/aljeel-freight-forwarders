CREATE TABLE "ShipmentInvite" (
    "shipmentId" TEXT NOT NULL,
    "forwarderId" TEXT NOT NULL,
    CONSTRAINT "ShipmentInvite_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShipmentInvite_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("shipmentId", "forwarderId")
);

-- Preserve current visibility: every existing forwarder is invited to every existing shipment.
INSERT INTO "ShipmentInvite" ("shipmentId", "forwarderId")
SELECT "Shipment"."id", "User"."id"
FROM "Shipment" CROSS JOIN "User"
WHERE "User"."role" = 'FORWARDER';
