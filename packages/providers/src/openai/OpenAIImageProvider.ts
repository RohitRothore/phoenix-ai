import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * OpenAI Image Provider (Phase 2)
 *
 * Uses the OpenAI Images API (DALL·E) for image generation.
 * This is a future implementation — the API call structure is
 * scaffolded but requires a real API key to function.
 *
 * When the API key is missing or the call fails, callers should
 * fall back to MockImageProvider.
 */
export class OpenAIImageProvider extends BaseImageProvider {
  readonly provider = 'openai-image';

  readonly model = 'dall-e-3';

  private readonly apiKey: string;

  constructor(apiKey: string = 'MOCK_KEY') {
    super();
    this.apiKey = apiKey;
  }

  async generateImage(
    request: GenerateImageRequest,
  ): Promise<GenerateImageResponse> {
    if (!this.apiKey || this.apiKey === 'MOCK_KEY') {
      throw new Error(
        'OpenAI API key is required for OpenAIImageProvider. ' +
          'Use MockImageProvider when no key is available.',
      );
    }

    // Placeholder for actual OpenAI DALL·E integration.
    // When the API key is available, replace with:
    //
    // const response = await fetch('https://api.openai.com/v1/images/generations', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'dall-e-3',
    //     prompt: request.prompt,
    //     n: 1,
    //     size: `${request.width ?? 1024}x${request.height ?? 1024}`,
    //     ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
    //     ...(request.seed && { seed: request.seed }),
    //   }),
    // });
    // const data = await response.json();
    // const imageUrl = data.data[0].url;

    throw new Error(
      'OpenAIImageProvider is a future implementation. ' +
        'The DALL·E API is not yet integrated.',
    );
  }
}
