import { AnthropicProvider } from "./anthropic-provider";
import type { AiProvider } from "./types";

let aiProvider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  aiProvider ??= new AnthropicProvider();

  return aiProvider;
}
