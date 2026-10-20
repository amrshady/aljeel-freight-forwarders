import { describe, expect, it } from "vitest";
import {
  SAMPLE_SHIPMENT,
  SAR_PER_USD,
  chargeableKg,
  isShipmentLocked,
  lowestAmount,
  needsAwardReason,
  shipmentDetailsChanged,
  volumetricKg,
  toSar,
} from "./freight";

describe("air chargeable weight", () => {
  it("prices the 15 October sample on 1.42 kg", () => {
    const { actualWeightKg, lengthCm, widthCm, heightCm, cartons } =
      SAMPLE_SHIPMENT;
    expect(volumetricKg(lengthCm, widthCm, heightCm, cartons)).toBeCloseTo(
      1.420833,
      5,
    );
    expect(
      chargeableKg(actualWeightKg, lengthCm, widthCm, heightCm, cartons),
    ).toBe(1.42);
  });

  it("uses the actual weight when it is higher than the volume weight", () => {
    expect(chargeableKg(2.4, 25, 31, 11, 1)).toBe(2.4);
  });

  it("multiplies volume by the number of cartons", () => {
    expect(chargeableKg(1, 25, 31, 11, 2)).toBe(2.84);
  });
});

describe("shipment edit", () => {
  const current = { ...SAMPLE_SHIPMENT };

  it("treats an unchanged shipment as the same", () => {
    expect(shipmentDetailsChanged(current, { ...current })).toBe(false);
  });

  it("treats a changed weight as a new shipment for quoting", () => {
    expect(
      shipmentDetailsChanged(current, { ...current, actualWeightKg: 2 }),
    ).toBe(true);
  });

  it("treats a switch to sea as a new shipment for quoting", () => {
    expect(
      shipmentDetailsChanged(current, {
        ...current,
        mode: "SEA",
        cartons: null,
        actualWeightKg: null,
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        containerType: "40FT",
        containerCount: 1,
      }),
    ).toBe(true);
  });
});

describe("award reason", () => {
  const quotes = [
    { amount: 2_000, currency: "SAR" },
    { amount: 1_000, currency: "USD" },
  ];

  it("converts USD to SAR at the official peg", () => {
    expect(SAR_PER_USD).toBe(3.75);
    expect(toSar(1_000, "USD")).toBe(3_750);
    expect(toSar(2_000, "SAR")).toBe(2_000);
    expect(() => toSar(1, "EUR")).toThrow("Unsupported currency");
  });

  it("finds the lowest quote after currency conversion", () => {
    expect(lowestAmount(quotes)).toBe(2_000);
  });

  it("requires a reason when the chosen price is not the lowest", () => {
    expect(needsAwardReason(quotes[1], quotes)).toBe(true);
  });

  it("does not require a reason for the lowest price", () => {
    expect(needsAwardReason(quotes[0], quotes)).toBe(false);
  });
});

describe("shipment lock", () => {
  it("allows an open shipment without an award to be edited", () => {
    expect(isShipmentLocked({ status: "OPEN", award: null })).toBe(false);
  });

  it.each(["AWARDED", "APPROVED"])("locks a shipment with %s status", (status) => {
    expect(isShipmentLocked({ status, award: null })).toBe(true);
  });

  it("locks an open shipment when an award exists", () => {
    expect(isShipmentLocked({ status: "OPEN", award: { id: "award" } })).toBe(true);
  });
});
