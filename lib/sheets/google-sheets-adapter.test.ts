import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeAppendOrderResult } from "./google-sheets-adapter";

test("summarizes a successful Google Sheets append response", () => {
  const result = summarizeAppendOrderResult({
    data: {
      spreadsheetId: "spreadsheet-123456",
      tableRange: "Pedidos!A1:I10",
      updates: {
        updatedRange: "Pedidos!A11:I11",
        updatedRows: 1,
        updatedCells: 9,
      },
    },
  });

  assert.deepEqual(result, {
    spreadsheetIdSuffix: "123456",
    tableRange: "Pedidos!A1:I10",
    updatedRange: "Pedidos!A11:I11",
    updatedRows: 1,
    updatedCells: 9,
  });
});

test("rejects Google Sheets append responses without updated rows", () => {
  assert.throws(
    () =>
      summarizeAppendOrderResult({
        data: {
          spreadsheetId: "spreadsheet-123456",
          updates: {
            updatedRange: "Pedidos!A11:I11",
            updatedRows: 0,
            updatedCells: 0,
          },
        },
      }),
    /did not report updated rows/,
  );
});
