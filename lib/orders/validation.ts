import type { OrderInput } from "./types";

const DATE_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/[0-9]{4}$/;
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function positiveNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function parseOrderInput(value: unknown): OrderInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const serviceType = requiredString(value.serviceType);
  const serviceDate = requiredString(value.serviceDate);
  const loadingTime = requiredString(value.loadingTime);
  const origin = requiredString(value.origin);
  const destination = requiredString(value.destination);
  const cargoTons = positiveNumber(value.cargoTons);

  if (
    !serviceType ||
    !serviceDate ||
    !DATE_PATTERN.test(serviceDate) ||
    !loadingTime ||
    !TIME_PATTERN.test(loadingTime) ||
    !origin ||
    !destination ||
    cargoTons === null
  ) {
    return null;
  }

  return {
    serviceType,
    serviceDate,
    loadingTime,
    origin,
    destination,
    cargoTons,
    detail: optionalString(value.detail),
  };
}
