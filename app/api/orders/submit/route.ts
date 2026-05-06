import { parseOrderInput } from "@/lib/orders/validation";
import { GOOGLE_SHEETS_ORDER_APPEND_RANGE, getSheetsOrderWriter } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const order = parseOrderInput(body);

  if (!order) {
    return Response.json(
      { error: "Body must include a valid order" },
      { status: 400 },
    );
  }

  try {
    const sheetsResult = await getSheetsOrderWriter().appendOrder(order);

    console.info("[orders.submit.sheets.success]", {
      serviceDate: order.serviceDate,
      loadingTime: order.loadingTime,
      origin: order.origin,
      destination: order.destination,
      serviceType: order.serviceType,
      cargoTons: order.cargoTons,
      appendRange: GOOGLE_SHEETS_ORDER_APPEND_RANGE,
      sheets: sheetsResult,
    });

    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google Sheets error";
    const isConfigError = message.includes("GOOGLE_");

    console.error("[orders.submit.sheets.error]", {
      serviceDate: order.serviceDate,
      loadingTime: order.loadingTime,
      origin: order.origin,
      destination: order.destination,
      serviceType: order.serviceType,
      cargoTons: order.cargoTons,
      error: message,
    });

    return Response.json(
      {
        error: isConfigError
          ? "Google Sheets is not configured"
          : "Could not register order in Google Sheets",
        detail: message,
      },
      { status: isConfigError ? 500 : 502 },
    );
  }
}
