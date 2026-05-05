export const orderFieldNames = [
  "serviceDate",
  "loadingTime",
  "origin",
  "destination",
  "serviceType",
  "cargoTons",
] as const;

export type OrderFieldName = (typeof orderFieldNames)[number];

export type OrderExtraction = {
  serviceDate: string | null;
  loadingTime: string | null;
  origin: string | null;
  destination: string | null;
  serviceType: string | null;
  cargoTons: number | null;
  detail: string | null;
  missingFields: OrderFieldName[];
};

export type ExtractOrderFieldsInput = {
  message: string;
  currentDate?: Date;
};

export interface AiProvider {
  extractOrderFields(input: ExtractOrderFieldsInput): Promise<OrderExtraction>;
}
