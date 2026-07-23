import { ImageProvider } from '@phoenix/ai-core';

export abstract class BaseImageProvider implements ImageProvider {
  abstract readonly provider: string;

  abstract readonly model: string;

  abstract generateImage(
    request: Parameters<ImageProvider['generateImage']>[0],
  ): ReturnType<ImageProvider['generateImage']>;
}
