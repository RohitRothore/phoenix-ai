import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * Future Image Provider
 *
 * Placeholder for a future image provider that does not yet exist.
 * This class exists so the provider registry can always reference
 * every planned provider without breaking the application.
 *
 * In Phase 2, this can be replaced with a real implementation
 * (e.g., Runway, Pika, Kling AI, etc.) without changing any
 * application-layer code.
 */
export class FutureImageProvider extends BaseImageProvider {
  readonly provider = 'future-image';

  readonly model = 'future-v1';

  constructor() {
    super();
  }

  async generateImage(
    _request: GenerateImageRequest,
  ): Promise<GenerateImageResponse> {
    throw new Error(
      'FutureImageProvider is not yet implemented. ' +
        'Register a different image provider in the ProviderModule.',
    );
  }
}
