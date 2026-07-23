import { AIProvider, ImageProvider, MediaProvider } from '@phoenix/ai-core';

export class ProviderRegistry {
  private readonly aiProviders = new Map<string, AIProvider>();
  private readonly imageProviders = new Map<string, ImageProvider>();
  private readonly mediaProviders = new Map<string, MediaProvider>();

  register(provider: AIProvider | ImageProvider | MediaProvider): void {
    if (this.isImageProvider(provider)) {
      this.imageProviders.set(provider.provider, provider);
    } else if (this.isMediaProvider(provider)) {
      this.mediaProviders.set(provider.provider, provider);
    } else {
      this.aiProviders.set(provider.provider, provider);
    }
  }

  get(provider: string): AIProvider {
    const instance = this.aiProviders.get(provider);

    if (!instance) {
      throw new Error(`Provider '${provider}' is not registered.`);
    }

    return instance;
  }

  getImageProvider(provider?: string): ImageProvider | undefined {
    if (provider) {
      const instance = this.imageProviders.get(provider);
      if (instance) return instance;
    }

    // Return the first registered image provider, or undefined if none
    return [...this.imageProviders.values()][0];
  }

  getMediaProvider(): MediaProvider | undefined {
    // Return the first registered media provider, or undefined if none
    return [...this.mediaProviders.values()][0];
  }

  listImageProviders(): ImageProvider[] {
    return [...this.imageProviders.values()];
  }

  list(): AIProvider[] {
    return [...this.aiProviders.values()];
  }

  private isImageProvider(
    provider: AIProvider | ImageProvider | MediaProvider,
  ): provider is ImageProvider {
    return 'generateImage' in provider;
  }

  private isMediaProvider(
    provider: AIProvider | ImageProvider | MediaProvider,
  ): provider is MediaProvider {
    return 'generateAudio' in provider && 'generateVideo' in provider;
  }
}
