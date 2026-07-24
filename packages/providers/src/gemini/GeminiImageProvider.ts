import {
  GenerateImageRequest,
  GenerateImageResponse,
} from '@phoenix/ai-core';

import { BaseImageProvider } from '../base/BaseImageProvider';

/**
 * Gemini Image Provider (Phase 2)
 *
 * Uses the Gemini API (Nano Banana / gemini-2.5-flash-image) for image generation.
 *
 * When the API key is missing or the call fails, callers should
 * fall back to MockImageProvider.
 */
export class GeminiImageProvider extends BaseImageProvider {
  readonly provider = 'gemini-image';

  readonly model = 'gemini-2.5-flash-image';

  private readonly apiKey: string;

  private readonly maxRetries = 3;

  private readonly baseDelayMs = 2000;

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

    const start = Date.now();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const httpResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=${this.apiKey}`,
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
                          : '') +
                        (request.aspectRatio
                          ? `\nAspect ratio: ${request.aspectRatio} (compose the image accordingly)`
                          : ''),
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ['Image'],
              },
            }),
          },
        );

        if (httpResponse.status === 429 && attempt < this.maxRetries) {
          // Rate limited — parse retry delay from error body or use exponential backoff
          let retryDelayMs = this.baseDelayMs * Math.pow(2, attempt);
          console.log("🚀 ~ GeminiImageProvider ~ generateImage ~ retryDelayMs:", retryDelayMs)

          try {
            const errorBody = await httpResponse.json();
            const retryInfo = errorBody?.error?.details?.find(
              (d: { '@type': string; retryDelay?: string }) =>
                d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo',
            );
            if (retryInfo?.retryDelay) {
              // Parse duration like "11.820966691s"
              const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
              if (!isNaN(seconds)) {
                retryDelayMs = Math.ceil(seconds * 1000) + 500; // add 500ms buffer
              }
            }
          } catch {
            // Ignore parse errors, use exponential backoff
          }

          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }

        if (!httpResponse.ok) {
          const errorText = await httpResponse.text();
          throw new Error(
            `Gemini API error: ${httpResponse.status} ${httpResponse.statusText} - ${errorText}`,
          );
        }

        const data = await httpResponse.json();

        // Extract image data from response
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (part: { inlineData?: { mimeType: string; data: string } }) =>
            part.inlineData?.mimeType?.startsWith('image/'),
        );

        if (!imagePart?.inlineData?.data) {
          throw new Error('No image data received from Gemini API');
        }

        const imageBase64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;

        const result: GenerateImageResponse = {
          imageUrl: `data:${mimeType};base64,${imageBase64}`,
          imagePath: '',
          width: request.width ?? 1024,
          height: request.height ?? 1024,
          provider: 'gemini-image',
          model: 'gemini-2.5-flash-image',
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
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on 429 errors; rethrow immediately for other errors
        if (
          !(error instanceof Error) ||
          !error.message.includes('429')
        ) {
          throw new Error(
            `GeminiImageProvider failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (attempt >= this.maxRetries) {
          throw new Error(
            `GeminiImageProvider failed after ${this.maxRetries + 1} attempts: ${lastError.message}`,
          );
        }
      }
    }

    throw new Error(
      `GeminiImageProvider failed: ${lastError?.message ?? 'Unknown error'}`,
    );
  }
}