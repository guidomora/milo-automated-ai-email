import assert from "node:assert/strict";
import { test } from "node:test";

import { buildOrderSheetRow } from "./order-row";

test("builds an order row in the Google Sheets column order", () => {
  const row = buildOrderSheetRow(
    {
      serviceType: "Transporte terrestre",
      serviceDate: "13/05/2026",
      loadingTime: "14:30",
      origin: "Rosario",
      destination: "Cordoba",
      cargoTons: 28,
      detail: "Retirar con lona",
    },
    new Date("2026-05-04T17:08:00-03:00"),
  );

  assert.deepEqual(row, [
    "04/05/2026",
    "17:08",
    "Transporte terrestre",
    "13/05/2026",
    "14:30",
    "Rosario",
    "Cordoba",
    28,
    "Retirar con lona",
  ]);
});

test("uses an empty observation when detail is not provided", () => {
  const row = buildOrderSheetRow(
    {
      serviceType: "Carga consolidada",
      serviceDate: "15/05/2026",
      loadingTime: "09:00",
      origin: "Buenos Aires",
      destination: "Mendoza",
      cargoTons: 12,
      detail: null,
    },
    new Date("2026-05-04T08:05:00-03:00"),
  );

  assert.equal(row[8], "");
});
