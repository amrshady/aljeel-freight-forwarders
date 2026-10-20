"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  CONTAINER_TYPES,
  DEFAULT_PAYMENT_TERMS_DAYS,
  isShipmentLocked,
  needsAwardReason,
  roundMoney,
  shipmentDetailsChanged,
  type ShipmentDetails,
} from "@/lib/freight";
import { getSessionUser } from "@/lib/session";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function number(formData: FormData, key: string) {
  return Number(formData.get(key));
}

function selectedForwarderIds(formData: FormData) {
  return [...new Set(formData.getAll("forwarderIds").map(String).filter(Boolean))];
}

async function validForwarderIds(formData: FormData) {
  const ids = selectedForwarderIds(formData);
  if (ids.length === 0) return null;
  const forwarders = await prisma.user.findMany({
    where: { id: { in: ids }, role: "FORWARDER" },
    select: { id: true },
  });
  return forwarders.length === ids.length ? ids : null;
}

export async function signOut() {
  redirect("/cdn-cgi/access/logout");
}

function shipmentInput(formData: FormData) {
  const mode = text(formData, "mode");
  const reference = text(formData, "reference");
  const shipper = text(formData, "shipper");
  const origin = text(formData, "origin");
  const destination = text(formData, "destination");
  const goods = text(formData, "goods");
  const shared = { reference, shipper, origin, destination, goods };

  if (!reference || !shipper || !origin || !destination || !goods) {
    return { ok: false, error: "invalid" } as const;
  }

  if (mode === "AIR") {
    const cartons = number(formData, "cartons");
    const actualWeightKg = number(formData, "actualWeightKg");
    const lengthCm = number(formData, "lengthCm");
    const widthCm = number(formData, "widthCm");
    const heightCm = number(formData, "heightCm");
    const valid =
      Number.isInteger(cartons) &&
      cartons > 0 &&
      actualWeightKg > 0 &&
      lengthCm > 0 &&
      widthCm > 0 &&
      heightCm > 0;
    if (!valid) return { ok: false, error: "invalid" } as const;
    return {
      ok: true,
      input: {
        ...shared,
        mode: "AIR",
        cartons,
        actualWeightKg,
        lengthCm,
        widthCm,
        heightCm,
        containerType: null,
        containerCount: null,
      },
    } as const;
  }

  if (mode === "SEA") {
    const containerType = text(formData, "containerType");
    const containerCount = number(formData, "containerCount");
    const known = CONTAINER_TYPES.some((item) => item.value === containerType);
    if (!known || !Number.isInteger(containerCount) || containerCount <= 0) {
      return { ok: false, error: "invalid" } as const;
    }
    return {
      ok: true,
      input: {
        ...shared,
        mode: "SEA",
        cartons: null,
        actualWeightKg: null,
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        containerType,
        containerCount,
      },
    } as const;
  }

  return { ok: false, error: "invalid" } as const;
}

function isDuplicate(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createShipment(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const parsed = shipmentInput(formData);
  if (!parsed.ok) redirect(`/shipments/new?error=${parsed.error}`);
  const forwarderIds = await validForwarderIds(formData);
  if (!forwarderIds) redirect("/shipments/new?error=invite");

  try {
    const shipment = await prisma.shipment.create({
      data: {
        ...parsed.input,
        createdById: user.id,
        invites: {
          create: forwarderIds.map((forwarderId) => ({ forwarderId })),
        },
      },
    });
    redirect(`/shipments/${shipment.id}`);
  } catch (error) {
    if (isDuplicate(error)) redirect("/shipments/new?error=duplicate");
    throw error;
  }
}

function detailsOf(shipment: {
  mode: string;
  reference: string;
  shipper: string;
  origin: string;
  destination: string;
  goods: string;
  cartons: number | null;
  actualWeightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  containerType: string | null;
  containerCount: number | null;
}): ShipmentDetails {
  return {
    mode: shipment.mode,
    reference: shipment.reference,
    shipper: shipment.shipper,
    origin: shipment.origin,
    destination: shipment.destination,
    goods: shipment.goods,
    cartons: shipment.cartons,
    actualWeightKg: shipment.actualWeightKg,
    lengthCm: shipment.lengthCm,
    widthCm: shipment.widthCm,
    heightCm: shipment.heightCm,
    containerType: shipment.containerType,
    containerCount: shipment.containerCount,
  };
}

export async function updateShipment(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { award: true, invites: true, quotes: true },
  });
  if (!existing) redirect("/shipments");
  if (isShipmentLocked(existing)) {
    redirect(`/shipments/${shipmentId}?error=locked`);
  }

  const parsed = shipmentInput(formData);
  if (!parsed.ok) redirect(`/shipments/${shipmentId}/edit?error=${parsed.error}`);
  const forwarderIds = await validForwarderIds(formData);
  if (!forwarderIds) {
    redirect(`/shipments/${shipmentId}/edit?error=invite`);
  }

  const detailsChanged = shipmentDetailsChanged(detailsOf(existing), parsed.input);
  const currentIds = existing.invites.map((invite) => invite.forwarderId).sort();
  const nextIds = [...forwarderIds].sort();
  const invitesChanged = currentIds.join("\0") !== nextIds.join("\0");
  if (!detailsChanged && !invitesChanged) {
    redirect(`/shipments/${shipmentId}`);
  }

  try {
    const operations = [
      ...(detailsChanged
        ? [prisma.quote.deleteMany({ where: { shipmentId } })]
        : [
            prisma.quote.deleteMany({
              where: { shipmentId, forwarderId: { notIn: forwarderIds } },
            }),
          ]),
      prisma.shipmentInvite.deleteMany({ where: { shipmentId } }),
      prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          ...parsed.input,
          invites: {
            create: forwarderIds.map((forwarderId) => ({ forwarderId })),
          },
        },
      }),
    ];
    await prisma.$transaction(operations);
  } catch (error) {
    if (isDuplicate(error)) {
      redirect(`/shipments/${shipmentId}/edit?error=duplicate`);
    }
    throw error;
  }

  const removedQuotedForwarder = existing.quotes.some(
    (quote) => !forwarderIds.includes(quote.forwarderId),
  );
  redirect(
    detailsChanged || removedQuotedForwarder
      ? `/shipments/${shipmentId}?cleared=1`
      : `/shipments/${shipmentId}`,
  );
}

export async function deleteShipment(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { award: true },
  });
  if (!existing) redirect("/shipments");
  if (isShipmentLocked(existing)) {
    redirect(`/shipments/${shipmentId}?error=locked`);
  }

  await prisma.$transaction([
    prisma.quote.deleteMany({ where: { shipmentId } }),
    prisma.shipment.delete({ where: { id: shipmentId } }),
  ]);

  redirect("/shipments");
}

export async function submitQuote(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "FORWARDER") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const amount = roundMoney(number(formData, "amount"));
  const currency = text(formData, "currency") || "SAR";
  const paymentTermsDays =
    number(formData, "paymentTermsDays") || DEFAULT_PAYMENT_TERMS_DAYS;
  const note = text(formData, "note");

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { invites: { where: { forwarderId: user.id } } },
  });
  if (!shipment) redirect("/shipments");
  if (shipment.invites.length === 0) redirect("/shipments");
  if (shipment.status !== "OPEN") {
    redirect(`/shipments/${shipmentId}?error=closed`);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(`/shipments/${shipmentId}?error=amount`);
  }
  if (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 0) {
    redirect(`/shipments/${shipmentId}?error=terms`);
  }
  if (currency !== "SAR" && currency !== "USD") {
    redirect(`/shipments/${shipmentId}?error=currency`);
  }

  try {
    await prisma.quote.create({
      data: {
        shipmentId,
        forwarderId: user.id,
        amount,
        currency,
        paymentTermsDays,
        note,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`/shipments/${shipmentId}?error=once`);
    }
    throw error;
  }

  redirect(`/shipments/${shipmentId}`);
}

export async function awardQuote(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const quoteId = text(formData, "quoteId");
  const reason = text(formData, "reason");

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { quotes: true, award: true },
  });
  if (!shipment || shipment.award || shipment.status !== "OPEN") {
    redirect(`/shipments/${shipmentId}?error=closed`);
  }

  const quote = shipment.quotes.find((item) => item.id === quoteId);
  if (!quote) redirect(`/shipments/${shipmentId}?error=quote`);
  if (needsAwardReason(quote, shipment.quotes) && !reason) {
    redirect(`/shipments/${shipmentId}?error=reason`);
  }

  await prisma.$transaction([
    prisma.award.create({
      data: {
        shipmentId,
        quoteId,
        reason,
        awardedById: user.id,
      },
    }),
    prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: "AWARDED" },
    }),
  ]);

  redirect(`/shipments/${shipmentId}`);
}

export async function approveAward(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "FINANCE") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { award: true },
  });
  if (!shipment?.award || shipment.status !== "AWARDED") {
    redirect(`/shipments/${shipmentId}?error=closed`);
  }

  await prisma.$transaction([
    prisma.award.update({
      where: { shipmentId },
      data: { approvedById: user.id, approvedAt: new Date() },
    }),
    prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: "APPROVED" },
    }),
  ]);

  redirect(`/shipments/${shipmentId}`);
}
