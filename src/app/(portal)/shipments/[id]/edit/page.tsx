import { ShipmentForm } from "@/components/shipment-form";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isShipmentLocked } from "@/lib/freight";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the air weight and dimensions, or the sea container count.",
  duplicate: "That reference already exists.",
  invite: "Choose at least one forwarder.",
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
  const [shipment, forwarders] = await Promise.all([
    prisma.shipment.findUnique({
      where: { id },
      include: { award: true, invites: true },
    }),
    prisma.user.findMany({
      where: { role: "FORWARDER" },
      orderBy: [{ company: "asc" }, { name: "asc" }],
      select: { id: true, company: true, name: true },
    }),
  ]);
  if (!shipment) notFound();
  if (isShipmentLocked(shipment)) {
    redirect(`/shipments/${shipment.id}?error=locked`);
  }

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">
        Edit {shipment.reference}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Saving a change to the shipment removes every price already sent, and
        any award, so forwarders quote again.
      </p>
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <ShipmentForm
          shipmentId={shipment.id}
          error={error ? errors[error] : undefined}
          forwarders={forwarders.map((forwarder) => ({
            id: forwarder.id,
            label: forwarder.company ?? forwarder.name,
          }))}
          selectedForwarderIds={shipment.invites.map(
            (invite) => invite.forwarderId,
          )}
          initial={{
            mode: shipment.mode === "SEA" ? "SEA" : "AIR",
            reference: shipment.reference,
            shipper: shipment.shipper,
            origin: shipment.origin,
            destination: shipment.destination,
            goods: shipment.goods,
            cartons: shipment.cartons == null ? "" : String(shipment.cartons),
            actualWeightKg:
              shipment.actualWeightKg == null
                ? ""
                : String(shipment.actualWeightKg),
            lengthCm: shipment.lengthCm == null ? "" : String(shipment.lengthCm),
            widthCm: shipment.widthCm == null ? "" : String(shipment.widthCm),
            heightCm: shipment.heightCm == null ? "" : String(shipment.heightCm),
            containerType: shipment.containerType ?? "20FT",
            containerCount:
              shipment.containerCount == null
                ? ""
                : String(shipment.containerCount),
          }}
        />
      </div>
    </main>
  );
}
