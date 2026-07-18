import { AIProvider } from "@phoenix/ai-core";

export abstract class BaseProvider implements AIProvider {
  abstract readonly provider: string;

  abstract readonly model: string;

  abstract generateText(
    request: Parameters<AIProvider["generateText"]>[0]
  ): ReturnType<AIProvider["generateText"]>;
}