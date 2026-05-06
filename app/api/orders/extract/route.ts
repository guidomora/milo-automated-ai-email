import { getAiProvider } from "@/lib/ai";

export const runtime = "nodejs";

type ExtractOrderRequest = {
  message?: unknown;
};

function isValidMessage(message: unknown): message is string {
  return typeof message === "string" && message.trim().length > 0;
}

export async function POST(request: Request) {
  let body: ExtractOrderRequest;

  try {
    body = (await request.json()) as ExtractOrderRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidMessage(body.message)) {
    return Response.json(
      { error: "Body must include a non-empty message string" },
      { status: 400 },
    );
  }

  try {
    const message = body.message.trim();
    const extraction = await getAiProvider().extractOrderFields({
      message,
    });

    console.info("[orders.extract.success]", {
      messageLength: message.length,
      extraction: {
        serviceDate: extraction.serviceDate,
        loadingTime: extraction.loadingTime,
        origin: extraction.origin,
        destination: extraction.destination,
        serviceType: extraction.serviceType,
        cargoTons: extraction.cargoTons,
      },
      missingFields: extraction.missingFields,
    });

    return Response.json({ extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    const isConfigError = message.includes("AI_KEY");

    console.error("[orders.extract.error]", {
      messageLength: body.message.trim().length,
      error: message,
    });

    return Response.json(
      {
        error: isConfigError
          ? "AI service is not configured"
          : "Could not extract order fields",
        detail: message,
      },
      { status: isConfigError ? 500 : 502 },
    );
  }
}
