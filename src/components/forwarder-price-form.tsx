import { submitQuote, updateQuote } from "@/app/actions";
import { DeleteQuoteButton } from "@/components/delete-quote-button";
import { DEFAULT_PAYMENT_TERMS_DAYS } from "@/lib/freight";

export function ForwarderPriceForm({
  shipmentId,
  mode,
  quote,
}: {
  shipmentId: string;
  mode: string;
  quote?: {
    amount: number;
    currency: string;
    paymentTermsDays: number;
    note: string;
  };
}) {
  const editing = Boolean(quote);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="font-medium text-foreground">Your price</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "SEA"
          ? "Price this container requirement."
          : "Price the chargeable weight."}{" "}
        Other forwarders cannot see this.{" "}
        {editing
          ? "You can change or remove it until Procurement awards the shipment."
          : `Payment terms start at ${DEFAULT_PAYMENT_TERMS_DAYS} days.`}
      </p>
      <form
        key={editing ? "saved" : "new"}
        action={editing ? updateQuote : submitQuote}
        className="mt-4 grid gap-4 sm:grid-cols-3"
      >
        <input type="hidden" name="shipmentId" value={shipmentId} />
        <label className="text-sm text-foreground">
          Price
          <input
            required
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={quote?.amount}
            className="mt-1 w-full rounded-md border border-input px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground">
          Currency
          <select
            name="currency"
            defaultValue={quote?.currency ?? "SAR"}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="text-sm text-foreground">
          Payment terms (days)
          <input
            required
            name="paymentTermsDays"
            type="number"
            min="0"
            step="1"
            defaultValue={quote?.paymentTermsDays ?? DEFAULT_PAYMENT_TERMS_DAYS}
            className="mt-1 w-full rounded-md border border-input px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground sm:col-span-3">
          Note
          <input
            name="note"
            defaultValue={quote?.note ?? ""}
            className="mt-1 w-full rounded-md border border-input px-3 py-2"
          />
        </label>
        <button className="w-fit inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {editing ? "Save price" : "Send price"}
        </button>
      </form>
      {editing ? (
        <div className="mt-3">
          <DeleteQuoteButton shipmentId={shipmentId} />
        </div>
      ) : null}
    </section>
  );
}
