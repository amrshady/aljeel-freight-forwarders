import { describe, expect, it } from "vitest";
import {
  SAMPLE_SHIPMENT,
  chargeableKg,
  needsAwardReason,
  shipmentDetailsChanged,
  volumetricKg,
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
});

describe("award reason", () => {
  const quotes = [{ amount: 400 }, { amount: 450 }];

  it("requires a reason when the chosen price is not the lowest", () => {
    expect(needsAwardReason(450, quotes)).toBe(true);
  });

  it("does not require a reason for the lowest price", () => {
    expect(needsAwardReason(400, quotes)).toBe(false);
  });
});
