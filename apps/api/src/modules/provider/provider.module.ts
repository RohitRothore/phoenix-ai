import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeminiProvider,
  ProviderRegistry,
  MockMediaProvider,
} from '@phoenix/providers';

export const PROVIDER_REGISTRY = 'PROVIDER_REGISTRY';

@Module({
  providers: [
    {
      provide: PROVIDER_REGISTRY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ProviderRegistry => {
        const apiKey = config.getOrThrow<string>('GEMINI_API_KEY');
        const registry = new ProviderRegistry();
        registry.register(new GeminiProvider(apiKey));
        registry.register(new MockMediaProvider());
        return registry;
      },
    },
  ],
  exports: [PROVIDER_REGISTRY],
})
export class ProviderModule {}