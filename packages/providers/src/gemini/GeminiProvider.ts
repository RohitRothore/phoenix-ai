import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
} from '@phoenix/ai-core';

import { BaseProvider } from '../base/BaseProvider';

export class GeminiProvider extends BaseProvider {
  readonly provider = 'gemini';

  readonly model = 'gemini-2.5-flash';

  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string = 'MOCK_KEY') {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(
    request: GenerateTextRequest,
  ): Promise<GenerateTextResponse> {
    const generativeModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: request.systemPrompt,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 8192,
      },
    });

    const result = await generativeModel.generateContent(request.prompt);
    const text = result.response.text();

    return {
      provider: this.provider,
      model: this.model,
      text,
    };
  }
}