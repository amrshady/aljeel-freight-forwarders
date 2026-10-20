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

Before running these commands, copy `.env.example` to `.env` and set `DATABASE_URL`. The app is at http://localhost:3000.

## Deploy

Provide `DATABASE_URL`, `CF_ACCESS_TEAM_DOMAIN`, and `CF_ACCESS_AUD` through the deployment environment or secret manager. Do not commit their values. For a new deployment, run:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm build
pnpm start
```

## Cloudflare Access login

Set `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` in the deployment environment.
The team domain is the Access domain, such as `example.cloudflareaccess.com`,
without a scheme. Cloudflare Access must protect the site and pass its signed
identity assertion. If either setting is missing, nobody is treated as signed in.

In Access mode, signing out navigates to the portal's own `/cdn-cgi/access/logout` path.

Access users must be provisioned explicitly; verified identities are never
created automatically. Add or update one with:

```bash
pnpm exec tsx prisma/upsert-user.ts \
  --email person@example.test \
  --name "Example User" \
  --role PROCUREMENT \
  --company "Example Company"
```

Valid roles are `PROCUREMENT`, `FINANCE`, and `FORWARDER`. `--company` is
optional. Sign-in is only through Cloudflare Access.
