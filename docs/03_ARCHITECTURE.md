# Architecture

## Overview

Phoenix AI follows a **layered, modular architecture** with clear separation of concerns. The system is organized as a monorepo with shared packages, a NestJS backend, and a Next.js frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEXT PROMPT                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DIRECTOR AGENT                               │
│  (tone, style, pacing, visual style, comedy mechanics)         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORY AGENT                                  │
│  (plot, characters, acts, hook, ending)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCENE PLANNER                                │
│  (scene breakdown, visual prompts, durations)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DIALOGUE GENERATOR                           │
│  (character-specific dialogue, emotions, timing)               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT GENERATOR                             │
│  (render-ready prompts with camera, lighting, mood)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE GENERATOR (Phase 1)                    │
│  AI Images: MockImageProvider / GeminiImageProvider /           │
│  OpenAIImageProvider / PollinationsImageProvider                │
│  Each image → Asset document in MongoDB                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE ENHANCER                               │
│  (prompt enhancement, upscaling)                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCENE RENDERER (FFmpeg)                      │
│  Images → Video Clips with camera movements                     │
│  (zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down,     │
│   slow-camera-motion, fade, cross-fade, blur-transition)       │
│  Each clip → Asset document in MongoDB                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUBTITLE GENERATOR                           │
│  SRT captions from dialogues                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE GENERATOR                              │
│  TTS audio per dialogue line                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MUSIC GENERATOR                              │
│  Background score                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FFMPEG COMPOSER                              │
│  Stitch clips + audio + subtitles → Final MP4                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL MP4                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 2 Transition (Future)

```
Phase 1:  Image Generator → Image Enhancer → Scene Renderer (FFmpeg)
Phase 2:  Video Provider (replaces all three above)
```

The `VideoProvider` generates full video clips directly. The downstream pipeline (subtitles, voice, music, composition) is unchanged.

## Module Structure

### Backend (NestJS)

```
apps/api/src/
├── app.module.ts              # Root module
├── common/
│   ├── rendering/             # FFmpeg integration
│   │   ├── ffmpeg-process.service.ts
│   │   ├── local-ffmpeg-video-renderer.service.ts
│   │   └── local-ffmpeg-export.service.ts
│   └── storage/               # MongoDB + local storage
│       ├── schemas/           # Mongoose schemas
│       ├── mongodb-project.service.ts
│       ├── local-storage.service.ts
│       └── storage.module.ts
├── modules/
│   ├── ai/                    # AI agents and pipelines
│   │   ├── agents/            # Director, Story, Scene, Dialogue, Prompt, Voice
│   │   └── pipelines/         # Video preparation, subtitle
│   ├── provider/              # Provider registry and module
│   ├── pipeline/              # Image generation, scene rendering, pipeline state
│   │   ├── image-generation.service.ts
│   │   ├── prompt-enhancer.service.ts
│   │   ├── scene-renderer.service.ts
│   │   ├── pipeline-state.service.ts
│   │   ├── generation-queue.service.ts
│   │   └── project-assembler.service.ts
│   ├── assets/                # Asset management
│   │   └── asset.service.ts
│   └── projects/              # Project CRUD and orchestration
│       ├── projects.controller.ts
│       ├── projects.service.ts
│       └── projects.module.ts
```

### Shared Packages

```
packages/
├── ai-core/                   # AI contracts (Agent, Pipeline, Provider interfaces)
├── config/                    # Shared configuration
├── domain/                    # Domain models
├── prompts/                   # Prompt templates
├── providers/                 # Provider implementations
└── shared/                    # Shared utilities
```

## Data Flow

1. **User** creates a project via the Studio UI.
2. **ProjectsService** orchestrates the pipeline, calling agents and services in sequence.
3. **Agents** generate content (director plan, story, scenes, dialogues, prompts).
4. **ImageGenerationService** generates AI images using the provider registry.
5. **SceneRendererService** renders images into video clips using FFmpeg.
6. **AssetService** stores asset metadata in MongoDB.
7. **PipelineStateService** tracks stage status, timestamps, and logs.
8. **ProjectAssemblerService** assembles the final export.
9. **User** downloads the final MP4.

## Storage Layout

```
storage/
├── projects/
│   ├── {slug}/
│   │   ├── images/            # AI-generated images
│   │   ├── renders/           # FFmpeg-rendered scene clips
│   │   ├── audio/             # TTS audio files
│   │   ├── subtitles/         # SRT files
│   │   └── exports/           # Final MP4 exports
│   └── generated/             # Shared generated assets
```

## Database Collections

| Collection        | Description                          |
|-------------------|--------------------------------------|
| `projects`        | Project metadata                     |
| `projectartifacts`| Pipeline artifacts (director, story, etc.) |
| `assets`          | Image, video, audio, subtitle, export metadata |
| `pipelinestates`  | Stage status, timestamps, logs       |
| `generationjobs`  | Per-scene generation jobs            |
| `exports`         | Export metadata                      |
