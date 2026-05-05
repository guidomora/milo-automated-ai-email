import { orderFieldNames, type OrderExtraction, type OrderFieldName } from "./types";

const DATE_PATTERN = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/[0-9]{4}$/;
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableDate(value: unknown): string | null {
  const date = nullableString(value);
  return date && DATE_PATTERN.test(date) ? date : null;
}

function nullableTime(value: unknown): string | null {
  const time = nullableString(value);
  return time && TIME_PATTERN.test(time) ? time : null;
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function parseJsonObject(rawOutput: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(rawOutput);

    if (isRecord(parsed)) {
      return parsed;
    }
  } catch {
    const start = rawOutput.indexOf("{");
    const end = rawOutput.lastIndexOf("}");

    if (start >= 0 && end > start) {
      const parsed = JSON.parse(rawOutput.slice(start, end + 1));

      if (isRecord(parsed)) {
        return parsed;
      }
    }
  }

  throw new Error("AI response did not contain a valid JSON object");
}

function getMissingFields(
  extraction: Pick<OrderExtraction, OrderFieldName>,
): OrderFieldName[] {
  return orderFieldNames.filter((fieldName) => extraction[fieldName] === null);
}

export function parseOrderExtraction(rawOutput: string): OrderExtraction {
  const parsed = parseJsonObject(rawOutput);
  const extraction = {
    serviceDate: nullableDate(parsed.serviceDate),
    loadingTime: nullableTime(parsed.loadingTime),
    origin: nullableString(parsed.origin),
    destination: nullableString(parsed.destination),
    serviceType: nullableString(parsed.serviceType),
    cargoTons: nullableNumber(parsed.cargoTons),
    detail: nullableString(parsed.detail),
  };

  return {
    ...extraction,
    missingFields: getMissingFields(extraction),
  };
}
