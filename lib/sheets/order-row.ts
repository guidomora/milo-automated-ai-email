import { formatDateValue, formatTimeValue } from "@/lib/orders/date-time";
import type { OrderInput } from "@/lib/orders/types";

export type OrderSheetRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
];

export function buildOrderSheetRow(
  order: OrderInput,
  registeredAt = new Date(),
): OrderSheetRow {
  return [
    formatDateValue(registeredAt),
    formatTimeValue(registeredAt),
    order.serviceType,
    order.serviceDate,
    order.loadingTime,
    order.origin,
    order.destination,
    order.cargoTons,
    order.detail ?? "",
  ];
}
