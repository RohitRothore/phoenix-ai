import {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
} from "@phoenix/ai-core";

import { BaseProvider } from "../base/BaseProvider";

export class GeminiProvider extends BaseProvider {
  readonly provider = "gemini";

  readonly model = "gemini-2.5-pro";

  async generateText(
    request: GenerateTextRequest
  ): Promise<GenerateTextResponse> {
    console.log(request);

    return {
      provider: this.provider,
      model: this.model,
      text: "Mock Gemini Response",
    };
  }
}