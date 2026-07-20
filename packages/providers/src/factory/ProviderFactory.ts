import { GeminiProvider } from "../gemini/GeminiProvider";
import { ProviderRegistry } from "../registry/ProviderRegistry";

export class ProviderFactory {
  static create(): ProviderRegistry {
    const registry = new ProviderRegistry();

    registry.register(new GeminiProvider());

    return registry;
  }
}