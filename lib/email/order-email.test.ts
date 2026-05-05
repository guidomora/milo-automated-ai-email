import assert from "node:assert/strict";
import { test } from "node:test";

import { buildOrderEmailTemplate } from "./order-email";

test("builds the new service request email subject and text body", () => {
  const email = buildOrderEmailTemplate({
    order: {
      serviceType: "Transporte terrestre",
      serviceDate: "13/05/2026",
      loadingTime: "14:30",
      origin: "Rosario",
      destination: "Cordoba",
      cargoTons: 28,
      detail: null,
    },
    registeredAt: new Date("2026-05-04T17:08:00-03:00"),
  });

  assert.equal(email.subject, "Nueva solicitud de servicio");
  assert.equal(
    email.text,
    [
      "Nueva solicitud de servicio",
      "",
      "Tipo de servicio: Transporte terrestre",
      "Fecha del servicio: 13/05/2026",
      "Horario de carga: 14:30",
      "Origen: Rosario",
      "Destino: Cordoba",
      "Cantidad de toneladas: 28",
      "Fecha de registro: 04/05/2026",
      "Hora de registro: 17:08",
    ].join("\n"),
  );
});

test("escapes order values in the HTML body", () => {
  const email = buildOrderEmailTemplate({
    order: {
      serviceType: "Carga <especial>",
      serviceDate: "13/05/2026",
      loadingTime: "14:30",
      origin: "Rosario & zona",
      destination: "Cordoba",
      cargoTons: 28,
      detail: null,
    },
    registeredAt: new Date("2026-05-04T17:08:00-03:00"),
  });

  assert.match(email.html, /Carga &lt;especial&gt;/);
  assert.match(email.html, /Rosario &amp; zona/);
});
