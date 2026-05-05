"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderExtraction } from "@/lib/ai/types";
import { shouldAutoExtractMessage } from "@/lib/orders/auto-extraction";

const AUTO_EXTRACTION_DELAY_MS = 4000;

const serviceTypes = [
  "Transporte terrestre",
  "Carga consolidada",
  "Retiro y entrega",
  "Distribucion local",
  "Servicio especial",
];

type OrderFormState = {
  serviceType: string;
  serviceDate: string;
  loadingTime: string;
  origin: string;
  destination: string;
  cargoTons: string;
  detail: string;
};

const emptyFormState: OrderFormState = {
  serviceType: "",
  serviceDate: "",
  loadingTime: "",
  origin: "",
  destination: "",
  cargoTons: "",
  detail: "",
};

function toDateInputValue(date: string | null): string {
  if (!date) {
    return "";
  }

  const [day, month, year] = date.split("/");

  if (!day || !month || !year) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function toSheetDateValue(date: string): string {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function getFieldLabel(field: OrderExtraction["missingFields"][number]): string {
  const labels: Record<OrderExtraction["missingFields"][number], string> = {
    serviceDate: "fecha del servicio",
    loadingTime: "horario de carga",
    origin: "origen",
    destination: "destino",
    serviceType: "tipo de servicio",
    cargoTons: "cantidad de toneladas",
  };

  return labels[field];
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function OrderForm() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const lastAutoExtractedMessageRef = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [formValues, setFormValues] = useState<OrderFormState>(emptyFormState);
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speechStatus, setSpeechStatus] = useState(
    "Toca Dictar para completar el mensaje hablando.",
  );
  const [extractionStatus, setExtractionStatus] = useState(
    "Cuando el mensaje este listo, extrae los datos para revisar el formulario.",
  );
  const [submitStatus, setSubmitStatus] = useState(
    "Al confirmar, el pedido se registra en Google Sheets.",
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechStatus("Dictado pausado.");
      return;
    }

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setSpeechStatus(
        "Este navegador no permite dictado automatico. Podes usar el microfono del teclado del telefono.",
      );
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognitionRef.current = recognition;
    finalTranscriptRef.current = message.trim();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const transcript = event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setMessage(`${finalTranscript} ${interimTranscript}`.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
      setSpeechStatus(
        "No se pudo iniciar el dictado. Revisa el permiso del microfono.",
      );
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    setSpeechStatus("Escuchando...");
  };

  const updateField = (field: keyof OrderFormState, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const applyExtraction = useCallback((extraction: OrderExtraction) => {
    setFormValues({
      serviceType: extraction.serviceType ?? "",
      serviceDate: toDateInputValue(extraction.serviceDate),
      loadingTime: extraction.loadingTime ?? "",
      origin: extraction.origin ?? "",
      destination: extraction.destination ?? "",
      cargoTons:
        typeof extraction.cargoTons === "number" ? String(extraction.cargoTons) : "",
      detail: extraction.detail ?? "",
    });

    if (extraction.missingFields.length > 0) {
      setExtractionStatus(
        `Datos extraidos. Faltan: ${extraction.missingFields
          .map(getFieldLabel)
          .join(", ")}.`,
      );
      return;
    }

    setExtractionStatus("Datos extraidos. Revisa los campos antes de confirmar.");
  }, []);

  const extractFieldsFromMessage = useCallback(
    async (messageToExtract: string) => {
      setIsExtracting(true);
      setExtractionStatus("Extrayendo datos con IA...");

      try {
        const response = await fetch("/api/orders/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: messageToExtract }),
        });
        const body = (await response.json()) as {
          extraction?: OrderExtraction;
          error?: string;
        };

        if (!response.ok || !body.extraction) {
          throw new Error(body.error ?? "No se pudieron extraer los datos.");
        }

        applyExtraction(body.extraction);
      } catch (error) {
        setExtractionStatus(
          error instanceof Error
            ? error.message
            : "No se pudieron extraer los datos.",
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [applyExtraction],
  );

  useEffect(() => {
    if (
      !shouldAutoExtractMessage({
        message,
        lastExtractedMessage: lastAutoExtractedMessageRef.current,
        isListening,
        isExtracting,
      })
    ) {
      return;
    }

    const messageToExtract = message.trim();
    setExtractionStatus(
      "Cuando dejes de escribir por 4 segundos, extraigo los datos automaticamente.",
    );

    const timeoutId = window.setTimeout(() => {
      lastAutoExtractedMessageRef.current = messageToExtract;
      void extractFieldsFromMessage(messageToExtract);
    }, AUTO_EXTRACTION_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [extractFieldsFromMessage, isExtracting, isListening, message]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("Registrando pedido en Google Sheets...");

    try {
      const response = await fetch("/api/orders/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceType: formValues.serviceType,
          serviceDate: toSheetDateValue(formValues.serviceDate),
          loadingTime: formValues.loadingTime,
          origin: formValues.origin,
          destination: formValues.destination,
          cargoTons: Number(formValues.cargoTons),
          detail: formValues.detail,
        }),
      });
      const body = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "No se pudo registrar el pedido.");
      }

      setFormValues(emptyFormState);
      setMessage("");
      finalTranscriptRef.current = "";
      lastAutoExtractedMessageRef.current = null;
      setSubmitStatus("Pedido registrado en Google Sheets.");
    } catch (error) {
      setSubmitStatus(
        error instanceof Error ? error.message : "No se pudo registrar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#dbe4dd] bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="flex flex-col gap-3 rounded-md border border-[#dbe4dd] bg-[#f8fbf9] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label
                  htmlFor="voiceMessage"
                  className="text-sm font-medium text-[#223128]"
                >
                  Mensaje dictado
                </label>
                <p className="mt-1 text-sm leading-6 text-[#526158]">
                  Usa el dictado para dejar un detalle libre del pedido.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDictation}
                  className="flex min-h-12 w-full items-center justify-center rounded-md border border-[#225b3f] px-4 text-base font-semibold text-[#225b3f] transition hover:bg-[#eef6f1] focus:outline-none focus:ring-4 focus:ring-[#225b3f]/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-[#a9b8af] disabled:text-[#6f7d74] sm:w-auto"
                >
                  {isListening ? "Detener dictado" : "Dictar"}
                </button>
              </div>
            </div>

            <textarea
              id="voiceMessage"
              name="voiceMessage"
              value={message}
              onChange={(event) => {
                finalTranscriptRef.current = event.target.value;
                setMessage(event.target.value);
              }}
              rows={4}
              placeholder="El texto dictado va a aparecer aca..."
              className="min-h-28 rounded-md border border-[#cbd8cf] bg-white px-3 py-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
            />

            <p className="text-sm leading-6 text-[#526158]" aria-live="polite">
              {speechStatus}
            </p>
            <p className="text-sm leading-6 text-[#526158]" aria-live="polite">
              {extractionStatus}
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-medium text-[#223128]">
            Tipo de servicio
          </span>
          <select
            name="serviceType"
            required
            value={formValues.serviceType}
            onChange={(event) => updateField("serviceType", event.target.value)}
            className="h-12 rounded-md border border-[#cbd8cf] bg-white px-3 text-base text-[#17211b] outline-none transition focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          >
            <option value="" disabled>
              Selecciona una opcion
            </option>
            {serviceTypes.map((serviceType) => (
              <option key={serviceType} value={serviceType}>
                {serviceType}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#223128]">
            Fecha del servicio
          </span>
          <input
            name="serviceDate"
            type="date"
            value={formValues.serviceDate}
            onChange={(event) => updateField("serviceDate", event.target.value)}
            required
            className="h-12 rounded-md border border-[#cbd8cf] px-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#223128]">
            Horario de carga
          </span>
          <input
            name="loadingTime"
            type="time"
            value={formValues.loadingTime}
            onChange={(event) => updateField("loadingTime", event.target.value)}
            required
            className="h-12 rounded-md border border-[#cbd8cf] px-3 text-base text-[#17211b] outline-none transition focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#223128]">Origen</span>
          <input
            name="origin"
            type="text"
            autoComplete="street-address"
            placeholder="Ej. Planta Rosario"
            value={formValues.origin}
            onChange={(event) => updateField("origin", event.target.value)}
            required
            className="h-12 rounded-md border border-[#cbd8cf] px-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#223128]">Destino</span>
          <input
            name="destination"
            type="text"
            placeholder="Ej. Deposito Cordoba"
            value={formValues.destination}
            onChange={(event) => updateField("destination", event.target.value)}
            required
            className="h-12 rounded-md border border-[#cbd8cf] px-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>

        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-medium text-[#223128]">
            Cantidad de mercaderia Tn
          </span>
          <input
            name="cargoTons"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder="Ej. 28"
            value={formValues.cargoTons}
            onChange={(event) => updateField("cargoTons", event.target.value)}
            required
            className="h-12 rounded-md border border-[#cbd8cf] px-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>

        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-medium text-[#223128]">
            Detalle opcional
          </span>
          <textarea
            name="detail"
            value={formValues.detail}
            onChange={(event) => updateField("detail", event.target.value)}
            rows={3}
            placeholder="Aclaraciones adicionales del pedido"
            className="min-h-24 rounded-md border border-[#cbd8cf] px-3 py-3 text-base text-[#17211b] outline-none transition placeholder:text-[#8a978f] focus:border-[#2f7651] focus:ring-4 focus:ring-[#2f7651]/15"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md bg-[#225b3f] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#18452f] focus:outline-none focus:ring-4 focus:ring-[#225b3f]/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#8aa091]"
      >
        {isSubmitting ? "Cargando..." : "Confirmar y enviar pedido"}
      </button>
      <p className="mt-3 text-sm leading-6 text-[#526158]" aria-live="polite">
        {submitStatus}
      </p>
    </form>
  );
}
