import { AIProvider, MediaProvider } from '@phoenix/ai-core';

export class ProviderRegistry {
  private readonly aiProviders = new Map<string, AIProvider>();
  private readonly mediaProviders = new Map<string, MediaProvider>();

  register(provider: AIProvider | MediaProvider): void {
    if (this.isMediaProvider(provider)) {
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

  getMediaProvider(): MediaProvider | undefined {
    // Return the first registered media provider, or undefined if none
    return [...this.mediaProviders.values()][0];
  }

  private isMediaProvider(
    provider: AIProvider | MediaProvider,
  ): provider is MediaProvider {
    return 'generateAudio' in provider && 'generateVideo' in provider;
  }

  list(): AIProvider[] {
    return [...this.aiProviders.values()];
  }
}