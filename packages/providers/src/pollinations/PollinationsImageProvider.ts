import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

const MAX_PROMPT_LENGTH = 1000;

export class PollinationsImageProvider extends BaseImageProvider {
  readonly provider = 'pollinations-image';

  readonly model = 'flux';

  private readonly baseUrl = 'https://image.pollinations.ai/';

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

    let prompt = request.prompt;
    if (request.negativePrompt) {
      prompt = `${prompt} --no ${request.negativePrompt}`;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      prompt = prompt.slice(0, MAX_PROMPT_LENGTH);
    }

    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      nologo: 'true',
      model: this.model,
    });

    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `${this.baseUrl}prompt/${encodedPrompt}?${params.toString()}`;
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
