# Provider Engine

## Overview

The Provider Engine implements a **pluggable provider architecture** for AI media generation. Providers are selected at runtime via a registry/factory pattern. No provider is hardcoded.

## Architecture

```
packages/providers/
├── src/
│   ├── base/
│   │   └── BaseProvider.ts           # Abstract base class
│   ├── base-image/
│   │   └── BaseImageProvider.ts      # Abstract image provider
│   ├── mock/
│   │   └── MockImageProvider.ts      # Mock (placeholder) provider
│   ├── gemini/
│   │   └── GeminiImageProvider.ts    # Google Gemini provider
│   ├── openai/
│   │   └── OpenAIImageProvider.ts    # OpenAI provider
│   ├── pollinations/
│   │   └── PollinationsImageProvider.ts  # Pollinations provider
│   ├── future/
│   │   └── FutureImageProvider.ts    # Future video provider (Phase 2)
│   ├── registry/
│   │   └── ProviderRegistry.ts       # Provider registry
│   ├── factory/
│   │   └── ProviderFactory.ts        # Provider factory
│   └── index.ts                      # Public exports
```

## Provider Interface

### ImageProvider (ai-core contract)

```typescript
interface ImageProvider {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  getProviderName(): string;
  getModelName(): string;
  isAvailable(): boolean;
}

interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: string;
  seed?: number;
}

interface ImageGenerationResponse {
  imageUrl: string;
  imagePath: string;
  width: number;
  height: number;
  seed?: number;
  provider: string;
  model: string;
  generationTime: number;
}
```

## Provider Implementations

### 1. MockImageProvider

- **Purpose**: Generate placeholder images when no API key is available.
- **Status**: Active (Phase 1 default)
- **Behavior**: Creates solid-color images with scene text using FFmpeg.
- **API Key Required**: No

### 2. GeminiImageProvider

- **Purpose**: Generate images using Google's Gemini API.
- **Status**: Active (Phase 1)
- **API Key Required**: Yes (`GEMINI_API_KEY`)

### 3. OpenAIImageProvider

- **Purpose**: Generate images using OpenAI's DALL-E API.
- **Status**: Active (Phase 1)
- **API Key Required**: Yes (`OPENAI_API_KEY`)

### 4. PollinationsImageProvider

- **Purpose**: Generate images using Pollinations.AI (free, no API key).
- **Status**: Active (Phase 1)
- **API Key Required**: No

### 5. FutureImageProvider

- **Purpose**: Placeholder for Phase 2 video generation.
- **Status**: Future Implementation
- **Note**: Will be replaced by a `VideoProvider` in Phase 2.

## Provider Selection

Providers are selected via the `ProviderRegistry`, which is registered as a NestJS token (`PROVIDER_REGISTRY`).

### Selection Logic

1. If `GEMINI_API_KEY` is set → `GeminiImageProvider`
2. If `OPENAI_API_KEY` is set → `OpenAIImageProvider`
3. If no API key → `MockImageProvider` (always available)

Pollinations is available as an alternative free provider.

### Registry API

```typescript
class ProviderRegistry {
  registerImageProvider(provider: ImageProvider): void;
  getImageProvider(): ImageProvider | null;
  getVideoProvider(): VideoProvider | null;  // Phase 2
}
```

## Mock Mode

When no API key exists, the `MockImageProvider` is automatically used. It generates placeholder images (solid color with scene ID text) using FFmpeg. This allows the full application flow to complete without paid APIs.

## Phase 2: VideoProvider

In Phase 2, a `VideoProvider` interface will be introduced. The `FutureImageProvider` will be replaced with a concrete video provider. The remaining pipeline (scene rendering, subtitles, voice, music, composition) stays the same.

### VideoProvider (Future)

```typescript
interface VideoProvider {
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  getProviderName(): string;
  getModelName(): string;
  isAvailable(): boolean;
}
```

The `ProviderRegistry` will support both `ImageProvider` (Phase 1) and `VideoProvider` (Phase 2). The `ImageGenerationService` will be updated to use `VideoProvider` when available, falling back to `ImageProvider` + `SceneRendererService` (Phase 1 flow).

## NestJS Integration

```typescript
// provider.module.ts
@Module({
  providers: [
    {
      provide: PROVIDER_REGISTRY,
      useFactory: () => {
        const registry = new ProviderRegistry();
        // Register providers based on API keys
        if (process.env.GEMINI_API_KEY) {
          registry.registerImageProvider(new GeminiImageProvider(...));
        } else if (process.env.OPENAI_API_KEY) {
          registry.registerImageProvider(new OpenAIImageProvider(...));
        } else {
          registry.registerImageProvider(new MockImageProvider());
        }
        return registry;
      },
    },
  ],
  exports: [PROVIDER_REGISTRY],
})
export class ProviderModule {}
```
