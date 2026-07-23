import {
  GenerateImageRequest,
  GenerateImageResponse,
  ImageProvider,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * Mock Image Provider
 *
 * Generates deterministic placeholder images so the full pipeline can run
 * without any paid AI API. Used automatically when no API key is configured.
 *
 * The generated "image" is a simple PNG drawn to disk by the SceneRendererService
 * using FFmpeg. This provider returns the metadata and path that the rest of
 * the pipeline expects.
 */
export class MockImageProvider extends BaseImageProvider {
  readonly provider = 'mock-image';

  readonly model = 'mock-v1';

  async generateImage(
    request: GenerateImageRequest,
  ): Promise<GenerateImageResponse> {
    const start = Date.now();
    const width = request.width ?? 1024;
    const height = request.height ?? 1024;
    const seed = request.seed ?? Math.floor(Math.random() * 2_147_483_647);

    const imagePath = `images/mock-${Date.now()}-${seed}.png`;

    return {
      imageUrl: imagePath,
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
