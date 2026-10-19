# Aljeel freight forwarders

The freight quotation portal. It is its own site, with its own address, login list, and database. It is not part of the AP portal, and it does not use Maha.

Confirmed by Amr on 19 October 2026. The agent behind the Oracle upload is the freight agent already set up for this work.

## First version

Procurement creates one air shipment. Two forwarders each submit a price. Procurement picks one, with a reason if it is not the lowest. Finance approves.

The reference shipment is the 15 October 2026 pack: St. Jude Medical, Machelen to Al Jeel in Riyadh, reference 379785. One carton, 1.378 kg, 25 × 31 × 11 cm. The chargeable weight is 1.42 kg. Payment terms default to 90 days.

Air is priced on weight and dimensions. Sea, priced on the container, comes after this path works.

## Not in the first version

Auto-negotiation, the year-end savings report, and the Oracle upload. The freight agent prepares the Oracle file only after Finance approves an invoice on this portal.

## Run locally

```bash
pnpm install
pnpm exec prisma migrate dev
pnpm db:seed
pnpm dev
```

The app is at http://localhost:3000. Sign in is local and has no password. The database is a SQLite file in this repo, not the AP database.
