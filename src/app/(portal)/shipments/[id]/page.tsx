import { approveAward, awardQuote, submitQuote } from "@/app/actions";
import { prisma } from "@/lib/db";
import {
  DEFAULT_PAYMENT_TERMS_DAYS,
  chargeableKg,
  formatKg,
  formatMoney,
  lowestAmount,
  needsAwardReason,
  statusLabel,
  volumetricKg,
} from "@/lib/freight";
import { getSessionUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  reason: "A reason is required when the chosen price is not the lowest.",
  amount: "Enter a price greater than zero.",
  closed: "This shipment is no longer open.",
  once: "You already sent a price for this shipment.",
  terms: "Payment terms must be a whole number of days.",
  currency: "Use SAR or USD.",
  quote: "Choose one of the prices.",
};

export default async function ShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const { id } = await params;
  const { error } = await searchParams;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      quotes: {
        include: { forwarder: true },
        orderBy: { amount: "asc" },
      },
      award: {
        include: {
          quote: { include: { forwarder: true } },
          awardedBy: true,
          approvedBy: true,
        },
      },
    },
  });
  if (!shipment) notFound();

  const volume = volumetricKg(
    shipment.lengthCm,
    shipment.widthCm,
    shipment.heightCm,
    shipment.cartons,
  );
  const chargeable = chargeableKg(
    shipment.actualWeightKg,
    shipment.lengthCm,
    shipment.widthCm,
    shipment.heightCm,
    shipment.cartons,
  );
  const ownQuote = shipment.quotes.find((quote) => quote.forwarderId === user.id);
  const visibleQuotes =
    user.role === "FORWARDER"
      ? shipment.quotes.filter((quote) => quote.forwarderId === user.id)
      : shipment.quotes;
  const lowest =
    shipment.quotes.length > 0 ? lowestAmount(shipment.quotes) : null;

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{statusLabel(shipment.status)}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {shipment.reference}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{shipment.goods}</p>
      </div>

      {error && errors[error] ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors[error]}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-2">
        <Fact label="Shipper" value={shipment.shipper} />
        <Fact label="Cartons" value={String(shipment.cartons)} />
        <Fact label="Origin" value={shipment.origin} />
        <Fact label="Destination" value={shipment.destination} />
        <Fact label="Actual weight" value={formatKg(shipment.actualWeightKg)} />
        <Fact
          label="Dimensions"
          value={`${shipment.lengthCm} × ${shipment.widthCm} × ${shipment.heightCm} cm`}
        />
        <Fact label="Volume weight" value={formatKg(volume)} />
        <Fact label="Chargeable weight" value={formatKg(chargeable)} />
      </section>

      {user.role === "FORWARDER" && shipment.status === "OPEN" && !ownQuote ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">Your price</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Other forwarders cannot see this. Payment terms start at{" "}
            {DEFAULT_PAYMENT_TERMS_DAYS} days.
          </p>
          <form action={submitQuote} className="mt-4 grid gap-4 sm:grid-cols-3">
            <input type="hidden" name="shipmentId" value={shipment.id} />
            <label className="text-sm text-foreground">
              Price
              <input
                required
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                className="mt-1 w-full rounded-md border border-input px-3 py-2"
              />
            </label>
            <label className="text-sm text-foreground">
              Currency
              <input
                name="currency"
                value="SAR"
                readOnly
                className="mt-1 w-full rounded-md border border-input bg-muted px-3 py-2"
              />
            </label>
            <label className="text-sm text-foreground">
              Payment terms (days)
              <input
                required
                name="paymentTermsDays"
                type="number"
                min="0"
                step="1"
                defaultValue={DEFAULT_PAYMENT_TERMS_DAYS}
                className="mt-1 w-full rounded-md border border-input px-3 py-2"
              />
            </label>
            <label className="text-sm text-foreground sm:col-span-3">
              Note
              <input
                name="note"
                className="mt-1 w-full rounded-md border border-input px-3 py-2"
              />
            </label>
            <button className="w-fit inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Send price
            </button>
          </form>
        </section>
      ) : null}

      {visibleQuotes.length > 0 ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">
            {user.role === "FORWARDER" ? "Your price" : "Prices"}
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {visibleQuotes.map((quote) => (
              <li key={quote.id} className="py-3 text-sm">
                <p className="font-medium text-foreground">
                  {user.role === "FORWARDER"
                    ? "Sent"
                    : (quote.forwarder.company ?? quote.forwarder.name)}
                  {" · "}
                  {formatMoney(quote.amount, quote.currency)}
                  {lowest !== null && quote.amount === lowest && user.role !== "FORWARDER"
                    ? " · Lowest"
                    : ""}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {quote.paymentTermsDays} days
                  {quote.note ? ` · ${quote.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {user.role === "PROCUREMENT" &&
      shipment.status === "OPEN" &&
      shipment.quotes.length > 0 ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">Choose a forwarder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If you do not choose the lowest price, write the reason.
          </p>
          <form action={awardQuote} className="mt-4 space-y-3">
            <input type="hidden" name="shipmentId" value={shipment.id} />
            {shipment.quotes.map((quote) => {
              const higher = needsAwardReason(quote.amount, shipment.quotes);
              return (
                <label key={quote.id} className="flex items-start gap-3 text-sm">
                  <input
                    required
                    type="radio"
                    name="quoteId"
                    value={quote.id}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-foreground">
                      {quote.forwarder.company ?? quote.forwarder.name} ·{" "}
                      {formatMoney(quote.amount, quote.currency)}
                    </span>
                    <span className="block text-muted-foreground">
                      {quote.paymentTermsDays} days
                      {higher ? "" : " · Lowest"}
                    </span>
                  </span>
                </label>
              );
            })}
            <label className="block text-sm text-foreground">
              Reason
              <textarea
                name="reason"
                rows={3}
                className="mt-1 w-full rounded-md border border-input px-3 py-2"
              />
            </label>
            <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Award
            </button>
          </form>
        </section>
      ) : null}

      {shipment.award && user.role !== "FORWARDER" ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">Award</h2>
          <p className="mt-2 text-sm text-foreground">
            {shipment.award.quote.forwarder.company ??
              shipment.award.quote.forwarder.name}{" "}
            ·{" "}
            {formatMoney(
              shipment.award.quote.amount,
              shipment.award.quote.currency,
            )}
          </p>
          {shipment.award.reason ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Reason: {shipment.award.reason}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Chosen as the lowest price.</p>
          )}
          {shipment.status === "APPROVED" && shipment.award.approvedBy ? (
            <p className="mt-2 text-sm text-primary">
              Approved by {shipment.award.approvedBy.name}.
            </p>
          ) : null}
          {user.role === "FINANCE" && shipment.status === "AWARDED" ? (
            <form action={approveAward} className="mt-4">
              <input type="hidden" name="shipmentId" value={shipment.id} />
              <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Approve
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {shipment.award && user.role === "FORWARDER" ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm text-sm text-foreground">
          {ownQuote && shipment.award.quoteId === ownQuote.id
            ? shipment.status === "APPROVED"
              ? "Finance approved your price."
              : "Procurement chose your price. Finance has not approved it yet."
            : shipment.status === "APPROVED"
              ? "Finance approved another forwarder."
              : "Procurement chose another forwarder."}
        </section>
      ) : null}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm text-foreground">{value}</span>
    </p>
  );
}
