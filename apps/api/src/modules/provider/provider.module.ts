import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeminiProvider,
  GeminiImageProvider,
  OpenAIImageProvider,
  PollinationsImageProvider,
  ProviderRegistry,
  RealMediaProvider,
  HuggingFaceMediaProvider,
  HuggingFaceImageProvider,
  MockImageProvider,
} from '@phoenix/providers';

export const PROVIDER_REGISTRY = 'PROVIDER_REGISTRY';

@Module({
  providers: [
    {
      provide: PROVIDER_REGISTRY,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ProviderRegistry => {
        const geminiApiKey = config.get<string>('GEMINI_API_KEY');
        const openAiApiKey = config.get<string>('OPENAI_API_KEY');
        const runwayApiKey = config.get<string>('RUNWAY_API_KEY');
        const elevenLabsApiKey = config.get<string>('ELEVENLABS_API_KEY');
        const huggingFaceApiKey = config.get<string>('HUGGINGFACE_API_KEY');

        const registry = new ProviderRegistry();

        // ─── AI Text Providers ───────────────────────────────────────────
        if (geminiApiKey) {
          registry.register(new GeminiProvider(geminiApiKey));
        }

        // ─── Image Providers ─────────────────────────────────────────────
        // Mock mode: if no image API key exists, automatically use MockImageProvider
        // so the full application flow can complete without paid APIs.

        // HuggingFace Stability AI SD3
        // if (huggingFaceApiKey) {
        //   registry.register(new HuggingFaceImageProvider(huggingFaceApiKey));
        // }

        // Pollinations is free and requires no API key
        registry.register(new PollinationsImageProvider());

        // Always register MockImageProvider as the ultimate fallback
        registry.register(new MockImageProvider());

        // ─── Media Providers (audio/video — Phase 2) ─────────────────────
        // Register free HuggingFace provider first (primary)
        if (huggingFaceApiKey) {
          registry.register(new HuggingFaceMediaProvider(huggingFaceApiKey));
        } else {
          // Register without key - will use mock fallback internally
          registry.register(new HuggingFaceMediaProvider());
        }

        // Register RealMedia provider as fallback
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
