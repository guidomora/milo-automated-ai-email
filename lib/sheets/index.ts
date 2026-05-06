import { GoogleSheetsAdapter, type SheetsOrderWriter } from "./google-sheets-adapter";

export { GOOGLE_SHEETS_ORDER_APPEND_RANGE } from "./constants";

let sheetsOrderWriter: SheetsOrderWriter | null = null;

export function getSheetsOrderWriter(): SheetsOrderWriter {
  sheetsOrderWriter ??= new GoogleSheetsAdapter();

  return sheetsOrderWriter;
}
