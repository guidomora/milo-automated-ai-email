import { GoogleSheetsAdapter, type SheetsOrderWriter } from "./google-sheets-adapter";

let sheetsOrderWriter: SheetsOrderWriter | null = null;

export function getSheetsOrderWriter(): SheetsOrderWriter {
  sheetsOrderWriter ??= new GoogleSheetsAdapter();

  return sheetsOrderWriter;
}
