import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * Pollinations Image Provider (Phase 2)
 *
 * Uses the free Pollinations.AI image generation API.
 * No API key required — the service is publicly accessible.
 *
 * When the call fails, callers should fall back to MockImageProvider.
 */
export class PollinationsImageProvider extends BaseImageProvider {
  readonly provider = 'pollinations-image';

  readonly model = 'gptimage';

  private readonly baseUrl = 'https://image.pollinations.ai/p';

  constructor() {
    super();
  }

  async generateImage(
    request: GenerateImageRequest,
  ): Promise<GenerateImageResponse> {
    const start = Date.now();
    const width = request.width ?? 1024;
    const height = request.height ?? 1024;
    const seed = request.seed ?? Math.floor(Math.random() * 2_147_483_647);

    const params = new URLSearchParams({
      prompt: request.prompt,
      width: String(width),
      height: String(height),
      seed: String(seed),
      ...(request.negativePrompt
        ? { negative_prompt: request.negativePrompt }
        : {}),
    });

    const imageUrl = `${this.baseUrl}?${params.toString()}`;
    const imagePath = `images/pollinations-${Date.now()}-${seed}.png`;

    return {
      imageUrl,
      imagePath,
      width,
      height,
      seed,
      provider: this.provider,
      model: this.model,
      generationTime: Date.now() - start,
      metadata: {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt ?? '',
        style: request.style ?? 'default',
      },
    };
  }
}
