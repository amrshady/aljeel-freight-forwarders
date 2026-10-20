"use client";

import { deleteShipment } from "@/app/actions";

export function DeleteShipmentButton({
  shipmentId,
  reference,
}: {
  shipmentId: string;
  reference: string;
}) {
  return (
    <form
      action={deleteShipment}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete shipment ${reference}? Prices already sent for it are removed too.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <button className="inline-flex h-9 items-center rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive hover:bg-destructive/10">
        Delete
      </button>
    </form>
  );
}
