import assert from "node:assert/strict";
import { test } from "node:test";

import { buildOrderExtractionPrompt } from "./order-extraction-prompt";

test("instructs the AI to extract service type as free text", () => {
  const prompt = buildOrderExtractionPrompt({
    message: "Necesito un expreso dedicado con hidrogrua",
    currentDate: new Date("2026-05-06T12:00:00-03:00"),
  });

  assert.match(prompt, /serviceType: tipo de servicio como texto libre/);
  assert.match(prompt, /No limites serviceType a opciones predefinidas/);
});
