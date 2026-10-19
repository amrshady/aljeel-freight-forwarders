"use client";

import { useState } from "react";
import { createShipment } from "@/app/actions";
import { SAMPLE_SHIPMENT } from "@/lib/freight";

const empty = {
  reference: "",
  shipper: "",
  origin: "",
  destination: "",
  goods: "",
  cartons: "",
  actualWeightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
};

export function ShipmentForm({ error }: { error?: string }) {
  const [values, setValues] = useState(empty);

  function set(key: keyof typeof empty, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={createShipment} className="space-y-4">
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
        onClick={() =>
          setValues({
            reference: SAMPLE_SHIPMENT.reference,
            shipper: SAMPLE_SHIPMENT.shipper,
            origin: SAMPLE_SHIPMENT.origin,
            destination: SAMPLE_SHIPMENT.destination,
            goods: SAMPLE_SHIPMENT.goods,
            cartons: String(SAMPLE_SHIPMENT.cartons),
            actualWeightKg: String(SAMPLE_SHIPMENT.actualWeightKg),
            lengthCm: String(SAMPLE_SHIPMENT.lengthCm),
            widthCm: String(SAMPLE_SHIPMENT.widthCm),
            heightCm: String(SAMPLE_SHIPMENT.heightCm),
          })
        }
      >
        Fill with test shipment
      </button>
      <Field
        label="Reference"
        name="reference"
        value={values.reference}
        onChange={(value) => set("reference", value)}
      />
      <Field
        label="Shipper"
        name="shipper"
        value={values.shipper}
        onChange={(value) => set("shipper", value)}
      />
      <Field
        label="Origin"
        name="origin"
        value={values.origin}
        onChange={(value) => set("origin", value)}
      />
      <Field
        label="Destination"
        name="destination"
        value={values.destination}
        onChange={(value) => set("destination", value)}
      />
      <Field
        label="Goods"
        name="goods"
        value={values.goods}
        onChange={(value) => set("goods", value)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Cartons"
          name="cartons"
          type="number"
          value={values.cartons}
          onChange={(value) => set("cartons", value)}
        />
        <Field
          label="Actual weight (kg)"
          name="actualWeightKg"
          type="number"
          step="0.001"
          value={values.actualWeightKg}
          onChange={(value) => set("actualWeightKg", value)}
        />
        <Field
          label="Length (cm)"
          name="lengthCm"
          type="number"
          value={values.lengthCm}
          onChange={(value) => set("lengthCm", value)}
        />
        <Field
          label="Width (cm)"
          name="widthCm"
          type="number"
          value={values.widthCm}
          onChange={(value) => set("widthCm", value)}
        />
        <Field
          label="Height (cm)"
          name="heightCm"
          type="number"
          value={values.heightCm}
          onChange={(value) => set("heightCm", value)}
        />
      </div>
      <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Create shipment
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm text-foreground">
      {label}
      <input
        required
        name={name}
        type={type}
        step={step}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}
