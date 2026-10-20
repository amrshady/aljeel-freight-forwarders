import { prisma } from "@/lib/db";
import { formatMoney, shipmentModeLabel, statusLabel } from "@/lib/freight";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const shipments = await prisma.shipment.findMany({
    where:
      user.role === "FORWARDER"
        ? { invites: { some: { forwarderId: user.id } } }
        : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      quotes: { where: user.role === "FORWARDER" ? { forwarderId: user.id } : undefined },
      award: true,
    },
  });

  return (
    <main>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "PROCUREMENT"
              ? "Create an air or sea shipment, then pick a price."
              : user.role === "FINANCE"
                ? "Approve the forwarder Procurement has chosen."
                : "Send one price. Other forwarders’ prices stay hidden."}
          </p>
        </div>
        {user.role === "PROCUREMENT" ? (
          <Link
            href="/shipments/new"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New shipment
          </Link>
        ) : null}
      </div>
      {shipments.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed bg-card px-4 py-8 text-sm text-muted-foreground">
          No shipments yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {shipments.map((shipment) => {
            const ownQuote = shipment.quotes[0];
            return (
              <li key={shipment.id}>
                <Link
                  href={`/shipments/${shipment.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-accent"
                >
                  <span>
                    <span className="block font-medium text-foreground">
                      {shipment.reference}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {shipment.origin} → {shipment.destination}
                    </span>
                  </span>
                  <span className="text-right text-sm">
                    <span className="block text-foreground">
                      {shipmentModeLabel(shipment.mode)} · {statusLabel(shipment.status)}
                    </span>
                    {user.role === "FORWARDER" && ownQuote ? (
                      <span className="mt-1 block text-muted-foreground">
                        Your price {formatMoney(ownQuote.amount, ownQuote.currency)}
                      </span>
                    ) : null}
                    {user.role !== "FORWARDER" ? (
                      <span className="mt-1 block text-muted-foreground">
                        {shipment.quotes.length}{" "}
                        {shipment.quotes.length === 1 ? "quote" : "quotes"}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
