import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import { getServerEnv } from "@/lib/config/env";
import { buildOrderExtractionPrompt } from "./order-extraction-prompt";
import { parseOrderExtraction } from "./order-extraction-parser";
import type { AiProvider, ExtractOrderFieldsInput, OrderExtraction } from "./types";

function getTextFromMessageContent(content: Message["content"]): string {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    const env = getServerEnv();

    this.client = new Anthropic({
      apiKey: env.aiKey,
    });
    this.model = env.aiModel;
  }

  async extractOrderFields(input: ExtractOrderFieldsInput): Promise<OrderExtraction> {
    const prompt = buildOrderExtractionPrompt(input);
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 700,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const rawOutput = getTextFromMessageContent(message.content);

    if (!rawOutput) {
      throw new Error("AI response did not include text content");
    }

    return parseOrderExtraction(rawOutput);
  }
}
