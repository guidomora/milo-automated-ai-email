type AutoExtractionState = {
  message: string;
  lastExtractedMessage: string | null;
  isListening: boolean;
  isExtracting: boolean;
};

export function shouldAutoExtractMessage({
  message,
  lastExtractedMessage,
  isListening,
  isExtracting,
}: AutoExtractionState): boolean {
  const trimmedMessage = message.trim();

  if (!trimmedMessage || isListening || isExtracting) {
    return false;
  }

  return trimmedMessage !== lastExtractedMessage;
}
