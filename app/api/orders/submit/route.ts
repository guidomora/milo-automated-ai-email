import { parseOrderInput } from "@/lib/orders/validation";
import { getSheetsOrderWriter } from "@/lib/sheets";

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
    await getSheetsOrderWriter().appendOrder(order);

    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google Sheets error";
    const isConfigError = message.includes("GOOGLE_");

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
