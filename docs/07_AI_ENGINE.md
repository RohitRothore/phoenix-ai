# AI Engine

## Overview

The AI Engine orchestrates multiple AI agents that work in sequence to transform a text prompt into a complete video. Each agent has a specific role and produces structured output that feeds into the next agent.

## Agent Architecture

```
packages/ai-core/src/
├── contracts/
│   ├── Agent.ts             # Agent interface
│   ├── Pipeline.ts          # Pipeline interface
│   ├── AIProvider.ts        # AI provider interface
│   ├── MediaProvider.ts     # Media provider interface
│   └── ImageProvider.ts     # Image provider interface (Phase 1)
├── index.ts                 # Public exports
```

### Agent Interface

```typescript
interface Agent<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

### Pipeline Interface

```typescript
interface Pipeline<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}
```

## Agents

### 1. Director Agent

- **Input**: Project topic, language, platform, style, humor
- **Output**: Director plan (genre, tone, pacing, visual style, comedy mechanics, content guidelines)
- **Purpose**: Establishes creative boundaries and storytelling guidelines

### 2. Story Agent

- **Input**: Project details + Director plan
- **Output**: Story (title, hook, premise, summary, acts, characters, ending)
- **Purpose**: Creates the narrative structure and character definitions

### 3. Scene Agent (Scene Planner)

- **Input**: Project details + Director plan + Story
- **Output**: Scenes (scene breakdown with visual prompts, durations, comedy elements)
- **Purpose**: Maps the story into filmable visual segments

### 4. Dialogue Agent

- **Input**: Project details + Director plan + Story + Scenes
- **Output**: Dialogues (character-specific dialogue with emotions and timing)
- **Purpose**: Writes natural, character-specific dialogue

### 5. Prompt Agent (Prompt Generator)

- **Input**: Project details + Director plan + Scenes + Dialogues
- **Output**: Prompts (render-ready prompts with camera, lighting, mood, negative prompt)
- **Purpose**: Creates prompts optimized for AI image generation

### 6. Voice Agent

- **Input**: Project details + Dialogues
- **Output**: Voice lines (TTS audio per dialogue line)
- **Purpose**: Generates character-specific voice audio

## Pipelines

### Video Preparation Pipeline

- **Input**: Project details + Scenes + Prompts
- **Output**: Video plan (scene jobs with render parameters)
- **Purpose**: Prepares scene jobs for rendering

### Subtitle Pipeline

- **Input**: Scenes + Dialogues
- **Output**: Subtitles (SRT cues)
- **Purpose**: Creates timed captions from dialogues

## Phase 1: Image Generation

The AI Engine uses the **ImageProvider** interface for image generation:

```typescript
interface ImageProvider {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  getProviderName(): string;
  getModelName(): string;
  isAvailable(): boolean;
}
```

### Image Provider Selection

The `ProviderRegistry` selects the image provider at runtime:

1. **GeminiImageProvider** — if `GEMINI_API_KEY` is set
2. **OpenAIImageProvider** — if `OPENAI_API_KEY` is set
3. **MockImageProvider** — if no API key (always available)

### Image Generation Flow

```
1. PromptEnhancerService enhances render prompts
2. ImageGenerationService iterates over scenes
3. For each scene:
   a. ProviderRegistry.getImageProvider() returns the active provider
   b. provider.generateImage(request) generates the image
   c. Image is saved to disk
   d. Asset document is created in MongoDB
   e. GenerationJob is updated
4. PipelineStateService marks image-generation stage as completed
```

## Phase 2: Video Generation (Future)

In Phase 2, the `VideoProvider` interface will be introduced:

```typescript
interface VideoProvider {
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  getProviderName(): string;
  getModelName(): string;
  isAvailable(): boolean;
}
```

The `ImageGenerationService` will check for a `VideoProvider` first. If available, it will generate video clips directly. If not, it will fall back to the Phase 1 flow (ImageProvider + SceneRendererService).

## Provider Registry

The `ProviderRegistry` is a NestJS token (`PROVIDER_REGISTRY`) that manages provider instances:

```typescript
// Registered in ProviderModule
{
  provide: PROVIDER_REGISTRY,
  useFactory: () => {
    const registry = new ProviderRegistry();
    if (process.env.GEMINI_API_KEY) {
      registry.registerImageProvider(new GeminiImageProvider(...));
    } else if (process.env.OPENAI_API_KEY) {
      registry.registerImageProvider(new OpenAIImageProvider(...));
    } else {
      registry.registerImageProvider(new MockImageProvider());
    }
    return registry;
  },
}
```

## Mock Mode

When no API key is available, the `MockImageProvider` generates placeholder images using FFmpeg:

```typescript
// Creates a solid-color image with scene text
await ffmpeg.run([
  '-y', '-f', 'lavfi',
  '-i', `color=c=7c3aed:s=1024x1024:d=1`,
  '-vf', `drawtext=...:text='Scene ${id}':...`,
  '-frames:v', '1',
  absPath,
]);
```

This ensures the full pipeline always completes without paid APIs.
