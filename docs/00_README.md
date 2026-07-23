# Phoenix AI — AI Video Studio

> **Phase 1: AI Images → FFmpeg Video Clips → Final MP4**
> Phase 2 (future): Replace ImageProvider with VideoProvider — pipeline stays identical.

Phoenix AI is an enterprise-grade, AI-powered video studio. It takes a single text prompt and produces a final MP4 video through a fully orchestrated multi-agent pipeline.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start MongoDB (required)
mongod

# Start the API (port 3001)
pnpm --filter phoenix-ai-api dev

# Start the Web UI (port 3000)
pnpm --filter phoenix-ai-web dev

# Open http://localhost:3000
```

## 📋 Table of Contents

- [Project Vision](01_PROJECT_VISION.md)
- [Architecture](03_ARCHITECTURE.md)
- [Backend](05_BACKEND.md)
- [Frontend](06_FRONTEND.md)
- [AI Engine](07_AI_ENGINE.md)
- [Provider Engine](08_PROVIDER_ENGINE.md)
- [Pipeline Engine](10_PIPELINE_ENGINE.md)
- [Storage Engine](11_STORAGE_ENGINE.md)
- [Video Engine](15_VIDEO_ENGINE.md)
- [Export Engine](17_EXPORT_ENGINE.md)
- [API Reference](18_API.md)
- [System Design](27_SYSTEM_DESIGN.md)
- [ADR](28_ADR.md)
- [Decision Log](31_DECISION_LOG.md)
- [Roadmap](26_ROADMAP.md)

## 🏗️ Architecture Overview

```
Text Prompt
    ↓
Director Agent          (creative constraints, tone, style)
    ↓
Story Agent             (plot, characters, acts)
    ↓
Scene Planner           (scene breakdown, visual prompts)
    ↓
Dialogue Generator      (character-specific dialogue)
    ↓
Prompt Generator        (render-ready prompts with camera/lighting)
    ↓
Image Generator         (AI images per scene — Phase 1: Mock/Gemini/OpenAI/Pollinations)
    ↓
Image Enhancer          (prompt enhancement, upscaling)
    ↓
Scene Renderer          (FFmpeg: images → video clips with camera movements)
    ↓
Subtitle Generator      (SRT captions)
    ↓
Voice Generator         (TTS audio)
    ↓
Music Generator         (background score)
    ↓
FFmpeg Composer         (stitch clips + audio + subtitles → final MP4)
    ↓
Final MP4
```

## 🔑 Key Design Decisions

1. **MongoDB is the primary database** — all metadata, pipeline state, and asset references live in MongoDB.
2. **Only binary assets on disk** — images, videos, audio, subtitles, and exports are stored in `storage/`.
3. **Provider abstraction** — `ImageProvider` interface with `Mock`, `Gemini`, `OpenAI`, `Pollinations`, and `Future` implementations.
4. **Mock mode by default** — if no API key is set, `MockImageProvider` generates placeholder images. The full pipeline completes without paid APIs.
5. **Phase 1 = AI Images** — each scene generates an AI image, which FFmpeg animates into a video clip.
6. **Phase 2 = AI Videos** — swap `ImageProvider` for `VideoProvider`. The rest of the pipeline is unchanged.

## 📦 Monorepo Structure

```
phoenix-ai/
├── apps/
│   ├── api/           # NestJS backend
│   └── web/           # Next.js frontend
├── packages/
│   ├── ai-core/       # AI contracts (Agent, Pipeline, Provider interfaces)
│   ├── config/        # Shared configuration
│   ├── domain/        # Domain models
│   ├── prompts/       # Prompt templates
│   ├── providers/     # Provider implementations
│   └── shared/        # Shared utilities
├── docs/              # Documentation
└── storage/           # Generated assets (binary only)
```

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript, MongoDB, Mongoose, FFmpeg
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI Providers**: Gemini, OpenAI, Pollinations, Mock
- **Infrastructure**: Docker, TurboRepo, pnpm
