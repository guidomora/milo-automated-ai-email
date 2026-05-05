import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldAutoExtractMessage } from "./auto-extraction";

test("does not auto extract an empty message", () => {
  assert.equal(
    shouldAutoExtractMessage({
      message: "   ",
      lastExtractedMessage: null,
      isListening: false,
      isExtracting: false,
    }),
    false,
  );
});

test("does not auto extract while dictation is active", () => {
  assert.equal(
    shouldAutoExtractMessage({
      message: "Retiro en Rosario manana a las 9",
      lastExtractedMessage: null,
      isListening: true,
      isExtracting: false,
    }),
    false,
  );
});

test("does not auto extract while an extraction is already running", () => {
  assert.equal(
    shouldAutoExtractMessage({
      message: "Retiro en Rosario manana a las 9",
      lastExtractedMessage: null,
      isListening: false,
      isExtracting: true,
    }),
    false,
  );
});

test("does not auto extract a message that was already extracted", () => {
  assert.equal(
    shouldAutoExtractMessage({
      message: "  Retiro en Rosario manana a las 9  ",
      lastExtractedMessage: "Retiro en Rosario manana a las 9",
      isListening: false,
      isExtracting: false,
    }),
    false,
  );
});

test("auto extracts when the trimmed message is new and ready", () => {
  assert.equal(
    shouldAutoExtractMessage({
      message: "  Retiro en Rosario manana a las 9  ",
      lastExtractedMessage: null,
      isListening: false,
      isExtracting: false,
    }),
    true,
  );
});
