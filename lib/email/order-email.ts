import { formatDateValue, formatTimeValue } from "@/lib/orders/date-time";
import type { OrderInput } from "@/lib/orders/types";
import type { EmailTemplate } from "./types";

const ORDER_EMAIL_SUBJECT = "Nueva solicitud de servicio";

type BuildOrderEmailTemplateInput = {
  order: OrderInput;
  registeredAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildOrderEmailTemplate({
  order,
  registeredAt,
}: BuildOrderEmailTemplateInput): EmailTemplate {
  const registeredDate = formatDateValue(registeredAt);
  const registeredTime = formatTimeValue(registeredAt);
  const fields = [
    ["Tipo de servicio", order.serviceType],
    ["Fecha del servicio", order.serviceDate],
    ["Horario de carga", order.loadingTime],
    ["Origen", order.origin],
    ["Destino", order.destination],
    ["Cantidad de toneladas", String(order.cargoTons)],
    ["Fecha de registro", registeredDate],
    ["Hora de registro", registeredTime],
  ];

  return {
    subject: ORDER_EMAIL_SUBJECT,
    text: [
      ORDER_EMAIL_SUBJECT,
      "",
      ...fields.map(([label, value]) => `${label}: ${value}`),
    ].join("\n"),
    html: [
      `<h1>${ORDER_EMAIL_SUBJECT}</h1>`,
      "<table>",
      "<tbody>",
      ...fields.map(
        ([label, value]) =>
          `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(
            value,
          )}</td></tr>`,
      ),
      "</tbody>",
      "</table>",
    ].join(""),
  };
}
