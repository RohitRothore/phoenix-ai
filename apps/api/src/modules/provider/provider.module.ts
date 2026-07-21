import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeminiProvider,
  ProviderRegistry,
  RealMediaProvider,
} from '@phoenix/providers';

export const PROVIDER_REGISTRY = 'PROVIDER_REGISTRY';

@Module({
  providers: [
    {
      provide: PROVIDER_REGISTRY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ProviderRegistry => {
        const geminiApiKey = config.get<string>('GEMINI_API_KEY');
        const runwayApiKey = config.get<string>('RUNWAY_API_KEY');
        const elevenLabsApiKey = config.get<string>('ELEVENLABS_API_KEY');

        const registry = new ProviderRegistry();

        if (geminiApiKey) {
          registry.register(new GeminiProvider(geminiApiKey));
        }

        registry.register(
          new RealMediaProvider({
            videoApiKey: runwayApiKey,
            audioApiKey: elevenLabsApiKey,
          }),
        );

        return registry;
      },
    },
  ],
  exports: [PROVIDER_REGISTRY],
})
export class ProviderModule {}