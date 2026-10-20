"use client";

import { deleteQuote } from "@/app/actions";

export function DeleteQuoteButton({ shipmentId }: { shipmentId: string }) {
  return (
    <form
      action={deleteQuote}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          "Delete your price? You can send a new one while this shipment is still open.",
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <button className="inline-flex h-10 items-center rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10">
        Delete price
      </button>
    </form>
  );
}
