export const AIR_DIVISOR = 6000;
export const DEFAULT_PAYMENT_TERMS_DAYS = 90;

export const ROLES = ["PROCUREMENT", "FINANCE", "FORWARDER"] as const;
export type Role = (typeof ROLES)[number];

export const SAMPLE_SHIPMENT = {
  reference: "TEST-1001",
  shipper: "Test Shipper",
  origin: "Test Origin",
  destination: "Test Destination",
  goods: "Test medical supplies",
  cartons: 1,
  actualWeightKg: 1.378,
  lengthCm: 25,
  widthCm: 31,
  heightCm: 11,
};

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function volumetricKg(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  cartons = 1,
) {
  return (lengthCm * widthCm * heightCm * cartons) / AIR_DIVISOR;
}

export function chargeableKg(
  actualKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  cartons = 1,
) {
  const chargeable = Math.max(
    actualKg,
    volumetricKg(lengthCm, widthCm, heightCm, cartons),
  );
  return roundMoney(chargeable);
}

export function lowestAmount(quotes: { amount: number }[]) {
  return Math.min(...quotes.map((quote) => quote.amount));
}

export function needsAwardReason(
  amount: number,
  quotes: { amount: number }[],
) {
  if (quotes.length === 0) return false;
  return roundMoney(amount) > roundMoney(lowestAmount(quotes));
}

export function formatKg(kg: number) {
  return `${kg.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })} kg`;
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function roleLabel(role: string) {
  if (role === "PROCUREMENT") return "Procurement";
  if (role === "FINANCE") return "Finance";
  if (role === "FORWARDER") return "Forwarder";
  return role;
}

export function statusLabel(status: string) {
  if (status === "OPEN") return "Open for quotes";
  if (status === "AWARDED") return "Waiting for Finance";
  if (status === "APPROVED") return "Approved";
  return status;
}
