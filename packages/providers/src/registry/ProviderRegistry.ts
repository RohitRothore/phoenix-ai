import { AIProvider } from "@phoenix/ai-core";

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.provider, provider);
  }

  get(provider: string): AIProvider {
    const instance = this.providers.get(provider);

    if (!instance) {
      throw new Error(`Provider '${provider}' is not registered.`);
    }

    return instance;
  }

  list(): AIProvider[] {
    return [...this.providers.values()];
  }
}