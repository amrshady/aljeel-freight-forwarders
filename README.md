# Freight quotation portal

A standalone air-freight quotation portal. Procurement creates a shipment, forwarders submit prices, Procurement awards a quote, and Finance approves it.

## First version

Procurement creates one air shipment. Two forwarders each submit a price. Procurement picks one, with a reason if it is not the lowest. Finance approves.

The included seed accounts and sample form data are dummy data only. Payment terms default to 90 days.

Air is priced on weight and dimensions. Sea, priced on the container, comes after this path works.

## Not in the first version

Auto-negotiation, the year-end savings report, and accounting-system uploads.

## Run locally

```bash
pnpm install
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm dev
```

Before running these commands, copy `.env.example` to `.env` and set `DATABASE_URL` plus all four `SEED_PASSWORD_*` values. The app is at http://localhost:3000.

## Deploy

Provide `DATABASE_URL` and all four seed password variables through the deployment environment or secret manager. Do not commit their values. For a new deployment, run:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm build
pnpm start
```

Run the seed again whenever a seed account password needs to be rotated; existing accounts receive new password hashes.
