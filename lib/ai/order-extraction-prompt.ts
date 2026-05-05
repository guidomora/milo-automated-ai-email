import type { ExtractOrderFieldsInput } from "./types";

function formatDateForPrompt(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

export function buildOrderExtractionPrompt({
  message,
  currentDate = new Date(),
}: ExtractOrderFieldsInput): string {
  return `Sos un extractor de datos para pedidos logisticos.

A partir del mensaje del usuario, extrae estos campos:
- serviceDate: fecha del servicio en formato dd/mm/aaaa
- loadingTime: horario de carga en formato 24 hs HH:mm
- origin: origen del servicio
- destination: destino del servicio
- serviceType: tipo de servicio
- cargoTons: cantidad de toneladas como numero
- detail: detalle adicional opcional como texto breve

Reglas:
- No inventes datos.
- Si un campo no aparece o no se puede inferir con seguridad, usa null.
- Normaliza fechas al formato dd/mm/aaaa.
- Normaliza horarios al formato HH:mm.
- Si el usuario dice "hoy", "manana" u otra fecha relativa, usa la fecha actual provista.
- Si el tipo de servicio no esta claro, usa null.
- detail es opcional: si no hay informacion adicional, usa null y no lo incluyas en missingFields.
- missingFields debe incluir todos los campos requeridos que sean null.
- Devuelve solo JSON valido. No uses markdown ni texto adicional.

Fecha actual: ${formatDateForPrompt(currentDate)}

Mensaje del usuario:
"""
${message}
"""

Formato exacto de respuesta:
{
  "serviceDate": string | null,
  "loadingTime": string | null,
  "origin": string | null,
  "destination": string | null,
  "serviceType": string | null,
  "cargoTons": number | null,
  "detail": string | null,
  "missingFields": string[]
}`;
}
