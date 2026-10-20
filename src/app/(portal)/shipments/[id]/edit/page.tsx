import { ShipmentForm } from "@/components/shipment-form";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the weight, dimensions, and carton count.",
  duplicate: "That reference already exists.",
};

export default async function EditShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const { id } = await params;
  const { error } = await searchParams;
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) notFound();

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        Edit {shipment.reference}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saving a change removes every price already sent, and any award, so
        forwarders quote again on the updated shipment.
      </p>
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <ShipmentForm
          shipmentId={shipment.id}
          error={error ? errors[error] : undefined}
          initial={{
            reference: shipment.reference,
            shipper: shipment.shipper,
            origin: shipment.origin,
            destination: shipment.destination,
            goods: shipment.goods,
            cartons: String(shipment.cartons),
            actualWeightKg: String(shipment.actualWeightKg),
            lengthCm: String(shipment.lengthCm),
            widthCm: String(shipment.widthCm),
            heightCm: String(shipment.heightCm),
          }}
        />
      </div>
    </main>
  );
}
