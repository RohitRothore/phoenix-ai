import { GeminiProvider } from "../gemini/GeminiProvider.js";
import { ProviderRegistry } from "../registry/ProviderRegistry.js";

export class ProviderFactory {
  static create(): ProviderRegistry {
    const registry = new ProviderRegistry();

    registry.register(new GeminiProvider());

    return registry;
  }
}