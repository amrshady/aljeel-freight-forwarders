import { ShipmentForm } from "@/components/shipment-form";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the air weight and dimensions, or the sea container count.",
  duplicate: "That reference already exists.",
  invite: "Choose at least one forwarder.",
};

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");
  const { error } = await searchParams;
  const forwarders = await prisma.user.findMany({
    where: { role: "FORWARDER" },
    orderBy: [{ company: "asc" }, { name: "asc" }],
    select: { id: true, company: true, name: true },
  });

  return (
    <main className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">New shipment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Air is priced on weight and dimensions. Sea is priced on the container.
      </p>
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <ShipmentForm
          error={error ? errors[error] : undefined}
          forwarders={forwarders.map((forwarder) => ({
            id: forwarder.id,
            label: forwarder.company ?? forwarder.name,
          }))}
        />
      </div>
    </main>
  );
}
