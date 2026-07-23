import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * Gemini Image Provider (Phase 2)
 *
 * Uses the Gemini API for image generation (Imagen).
 *
 * When the API key is missing or the call fails, callers should
 * fall back to MockImageProvider.
 */
export class GeminiImageProvider extends BaseImageProvider {
  readonly provider = 'gemini-image';

  readonly model = 'imagen-3.0';

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
        'Gemini API key is required for GeminiImageProvider. ' +
          'Use MockImageProvider when no key is available.',
      );
    }

    try {
      // Use Gemini REST API directly for image generation
      // Imagen models are accessed via the generative language API
      const httpResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      `Generate an image: ${request.prompt}` +
                      (request.negativePrompt
                        ? `\nNegative prompt: ${request.negativePrompt}`
                        : ''),
                  },
                ],
              },
            ],
            generationConfig: {
              aspectRatio: request.aspectRatio ?? '1:1',
            },
          }),
        },
      );

      if (!httpResponse.ok) {
        const errorText = await httpResponse.text();
        throw new Error(
          `Gemini API error: ${httpResponse.status} ${httpResponse.statusText} - ${errorText}`,
        );
      }

      const data = await httpResponse.json();

      // Extract image data from response
      // The response structure may vary based on the actual API
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (part: { inlineData?: { mimeType: string; data: string } }) =>
          part.inlineData?.mimeType?.startsWith('image/'),
      );

      if (!imagePart?.inlineData?.data) {
        throw new Error('No image data received from Gemini API');
      }

      const imageBase64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;

      const start = Date.now();

      const result: GenerateImageResponse = {
        imageUrl: `data:${mimeType};base64,${imageBase64}`,
        imagePath: '',
        width: request.width ?? 1024,
        height: request.height ?? 1024,
        provider: 'gemini-image',
        model: 'imagen-3.0',
        generationTime: Date.now() - start,
        metadata: {
          aspectRatio: request.aspectRatio ?? '1:1',
          mimeType,
        },
      };

      if (request.seed !== undefined) {
        result.seed = request.seed;
      }

      return result;
    } catch (error) {
      throw new Error(
        `GeminiImageProvider failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}