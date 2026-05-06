import { google, type sheets_v4 } from "googleapis";

import { getSheetsEnv } from "@/lib/config/env";
import type { OrderInput } from "@/lib/orders/types";
import { GOOGLE_SHEETS_ORDER_APPEND_RANGE } from "./constants";
import { buildOrderSheetRow } from "./order-row";

type AppendOrderResponse = {
  data: sheets_v4.Schema$AppendValuesResponse;
};

export type AppendOrderResult = {
  spreadsheetIdSuffix: string | null;
  tableRange: string | null;
  updatedRange: string | null;
  updatedRows: number;
  updatedCells: number;
};

export interface SheetsOrderWriter {
  appendOrder(order: OrderInput): Promise<AppendOrderResult>;
}

function getSpreadsheetIdSuffix(spreadsheetId: string | null | undefined): string | null {
  return spreadsheetId ? spreadsheetId.slice(-6) : null;
}

export function summarizeAppendOrderResult(response: AppendOrderResponse): AppendOrderResult {
  const updatedRows = response.data.updates?.updatedRows ?? 0;
  const updatedCells = response.data.updates?.updatedCells ?? 0;

  if (updatedRows < 1) {
    throw new Error("Google Sheets append did not report updated rows");
  }

  return {
    spreadsheetIdSuffix: getSpreadsheetIdSuffix(response.data.spreadsheetId),
    tableRange: response.data.tableRange ?? null,
    updatedRange: response.data.updates?.updatedRange ?? null,
    updatedRows,
    updatedCells,
  };
}

export class GoogleSheetsAdapter implements SheetsOrderWriter {
  private readonly sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string;

  constructor() {
    const env = getSheetsEnv();
    const auth = new google.auth.JWT({
      email: env.googleClientEmail,
      key: env.googlePrivateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.spreadsheetId = env.googleSheetId;
  }

  async appendOrder(order: OrderInput): Promise<AppendOrderResult> {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: GOOGLE_SHEETS_ORDER_APPEND_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [buildOrderSheetRow(order)],
      },
    });

    return summarizeAppendOrderResult(response);
  }
}
