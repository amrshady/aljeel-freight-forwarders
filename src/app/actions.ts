"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  DEFAULT_PAYMENT_TERMS_DAYS,
  needsAwardReason,
  roundMoney,
  shipmentDetailsChanged,
} from "@/lib/freight";
import { getSessionUser } from "@/lib/session";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function number(formData: FormData, key: string) {
  return Number(formData.get(key));
}

export async function signOut() {
  redirect("/cdn-cgi/access/logout");
}

function shipmentInput(formData: FormData) {
  const reference = text(formData, "reference");
  const shipper = text(formData, "shipper");
  const origin = text(formData, "origin");
  const destination = text(formData, "destination");
  const goods = text(formData, "goods");
  const cartons = number(formData, "cartons");
  const actualWeightKg = number(formData, "actualWeightKg");
  const lengthCm = number(formData, "lengthCm");
  const widthCm = number(formData, "widthCm");
  const heightCm = number(formData, "heightCm");

  const valid =
    reference &&
    shipper &&
    origin &&
    destination &&
    goods &&
    Number.isInteger(cartons) &&
    cartons > 0 &&
    actualWeightKg > 0 &&
    lengthCm > 0 &&
    widthCm > 0 &&
    heightCm > 0;

  if (!valid) return null;
  return {
    reference,
    shipper,
    origin,
    destination,
    goods,
    cartons,
    actualWeightKg,
    lengthCm,
    widthCm,
    heightCm,
  };
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

  const input = shipmentInput(formData);
  if (!input) redirect("/shipments/new?error=invalid");

  try {
    const shipment = await prisma.shipment.create({
      data: {
        ...input,
        createdById: user.id,
      },
    });
    redirect(`/shipments/${shipment.id}`);
  } catch (error) {
    if (isDuplicate(error)) redirect("/shipments/new?error=duplicate");
    throw error;
  }
}

export async function updateShipment(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "PROCUREMENT") redirect("/shipments");

  const shipmentId = text(formData, "shipmentId");
  const existing = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });
  if (!existing) redirect("/shipments");

  const input = shipmentInput(formData);
  if (!input) redirect(`/shipments/${shipmentId}/edit?error=invalid`);

  const detailsChanged = shipmentDetailsChanged(existing, input);

  try {
    if (detailsChanged) {
      await prisma.$transaction([
        prisma.award.deleteMany({ where: { shipmentId } }),
        prisma.quote.deleteMany({ where: { shipmentId } }),
        prisma.shipment.update({
          where: { id: shipmentId },
          data: { ...input, status: "OPEN" },
        }),
      ]);
    }
  } catch (error) {
    if (isDuplicate(error)) {
      redirect(`/shipments/${shipmentId}/edit?error=duplicate`);
    }
    throw error;
  }

  redirect(
    detailsChanged
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
  });
  if (!existing) redirect("/shipments");

  await prisma.$transaction([
    prisma.award.deleteMany({ where: { shipmentId } }),
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
  });
  if (!shipment) redirect("/shipments");
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
  if (needsAwardReason(quote.amount, shipment.quotes) && !reason) {
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
