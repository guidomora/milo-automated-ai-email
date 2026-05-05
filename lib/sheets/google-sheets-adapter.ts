import { google, type sheets_v4 } from "googleapis";

import { getSheetsEnv } from "@/lib/config/env";
import type { OrderInput } from "@/lib/orders/types";
import { GOOGLE_SHEETS_ORDER_APPEND_RANGE } from "./constants";
import { buildOrderSheetRow } from "./order-row";

export interface SheetsOrderWriter {
  appendOrder(order: OrderInput): Promise<void>;
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

  async appendOrder(order: OrderInput): Promise<void> {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: GOOGLE_SHEETS_ORDER_APPEND_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [buildOrderSheetRow(order)],
      },
    });
  }
}
