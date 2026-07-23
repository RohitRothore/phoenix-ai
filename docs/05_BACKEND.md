# Backend

## Overview

The Phoenix AI backend is built with **NestJS** and **TypeScript**. It provides a REST API for project management, AI pipeline orchestration, image generation, scene rendering, and export.

## Module Architecture

```
apps/api/src/
├── app.module.ts              # Root module — imports all feature modules
├── main.ts                    # Application bootstrap
├── common/
│   ├── rendering/             # FFmpeg integration services
│   │   ├── ffmpeg-process.service.ts      # Low-level FFmpeg process wrapper
│   │   ├── local-ffmpeg-video-renderer.service.ts  # Local video rendering (legacy)
│   │   └── local-ffmpeg-export.service.ts  # Local export (legacy)
│   └── storage/               # MongoDB + local file storage
│       ├── schemas/           # Mongoose schemas (Project, Asset, PipelineState, etc.)
│       ├── mongodb-project.service.ts    # MongoDB project CRUD
│       ├── local-storage.service.ts      # Local file I/O
│       └── storage.module.ts             # Storage module (registers schemas + services)
├── modules/
│   ├── ai/                    # AI agents and pipelines
│   │   ├── agents/            # Director, Story, Scene, Dialogue, Prompt, Voice agents
│   │   └── pipelines/         # Video preparation, subtitle pipelines
│   ├── provider/              # Provider registry and module
│   │   └── provider.module.ts  # Registers PROVIDER_REGISTRY token
│   ├── pipeline/              # New pipeline services (Phase 1)
│   │   ├── image-generation.service.ts    # AI image generation
│   │   ├── prompt-enhancer.service.ts     # Prompt enhancement
│   │   ├── scene-renderer.service.ts      # FFmpeg scene rendering
│   │   ├── pipeline-state.service.ts      # Pipeline state tracking
│   │   ├── generation-queue.service.ts    # Generation job queue
│   │   ├── project-assembler.service.ts   # Final export assembly
│   │   └── pipeline.module.ts             # Pipeline module
│   ├── assets/                # Asset management
│   │   ├── assets.module.ts
│   │   └── asset.service.ts    # CRUD for Asset documents
│   └── projects/              # Project orchestration
│       ├── projects.controller.ts  # REST API endpoints
│       ├── projects.service.ts     # Business logic
│       └── projects.module.ts      # Projects module
```

## New Services (Phase 1)

### ImageGenerationService

- Generates AI images for each scene using the provider registry.
- Stores each image as an Asset document in MongoDB.
- Supports mock mode (no API key required).
- Supports image regeneration per scene.

**Key methods:**
- `generateImages(input)` — Generate images for all scenes.
- `regenerateImage(projectId, slug, sceneId, prompt)` — Regenerate a single image.

### PromptEnhancerService

- Enhances render prompts before image generation.
- Adds style, lighting, and camera details to prompts.

**Key methods:**
- `enhancePrompts(scenes)` — Enhance an array of prompts.

### SceneRendererService

- Renders AI images into video clips using FFmpeg.
- Supports camera movements: zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, slow-camera-motion, fade, cross-fade, blur-transition.
- Each clip is stored as a VIDEO Asset document in MongoDB.

**Key methods:**
- `renderScenes(input)` — Render multiple scenes into video clips.

### AssetService

- Manages Asset documents in MongoDB.
- Asset types: IMAGE, VIDEO, AUDIO, SUBTITLE, EXPORT.
- Supports listing by project and type, creating, updating, and deleting.

**Key methods:**
- `create(asset)` — Create a new Asset document.
- `listByProject(projectId, type?)` — List assets by project and optional type.
- `update(id, patch)` — Update an Asset document.
- `delete(id)` — Delete an Asset document.
- `findByProjectAndScene(projectId, sceneId, type)` — Find a specific asset.

### PipelineStateService

- Tracks the status of each pipeline stage.
- Stages: director, story, scenes, dialogues, prompts, image-generation, scene-rendering, subtitle-generation, voice-generation, export.
- Status: pending, queued, running, completed, failed, cancelled.
- Supports timestamps, execution logs, retry, and resume.

**Key methods:**
- `setStatus(projectId, stage, status)` — Set the status of a stage.
- `addLog(projectId, stage, log)` — Add a log entry to a stage.
- `findByProject(projectId)` — Get all pipeline states for a project.
- `retry(projectId, stage)` — Retry a failed stage.
- `resume(projectId, stage)` — Resume a cancelled/failed stage.

### GenerationQueueService

- Manages generation jobs (per-scene, per-type).
- Tracks provider, status, timestamps, and logs.
- Supports retry and resume.

**Key methods:**
- `enqueue(job)` — Enqueue a new generation job.
- `setStatus(jobId, status)` — Set the status of a job.
- `setResponse(jobId, response)` — Set the response of a completed job.
- `listByProject(projectId)` — List all jobs for a project.

### ProjectAssemblerService

- Assembles the final export from scene clips.
- Stitches clips together using FFmpeg.

**Key methods:**
- `assembleExport(input)` — Assemble the final export.

## API Endpoints

### Project Management

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects` | Create a new project |
| GET | `/projects` | List all projects |
| GET | `/projects/:slug` | Get a project by slug |

### AI Pipeline

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:slug/director-plan` | Generate director plan |
| GET | `/projects/:slug/director-plan` | Get director plan |
| POST | `/projects/:slug/story` | Generate story |
| GET | `/projects/:slug/story` | Get story |
| POST | `/projects/:slug/scenes` | Generate scenes |
| GET | `/projects/:slug/scenes` | Get scenes |
| POST | `/projects/:slug/dialogues` | Generate dialogues |
| GET | `/projects/:slug/dialogues` | Get dialogues |
| POST | `/projects/:slug/prompts` | Generate render prompts |
| GET | `/projects/:slug/prompts` | Get render prompts |

### Image Generation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:slug/images` | Generate AI images for all scenes |
| POST | `/projects/:slug/images/:sceneId/regenerate` | Regenerate a single image |
| GET | `/projects/:slug/assets?type=IMAGE` | Get image assets |

### Scene Rendering

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:slug/render` | Render all scenes into video clips |
| POST | `/projects/:slug/render/:sceneId` | Render a single scene |
| GET | `/projects/:slug/assets?type=VIDEO` | Get video assets |

### Pipeline Status

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/:slug/pipeline` | Get pipeline status |
| POST | `/projects/:slug/pipeline/:stage/retry` | Retry a failed stage |
| POST | `/projects/:slug/pipeline/:stage/resume` | Resume a pipeline stage |

### Export

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/:slug/export` | Export the final captioned MP4 |
| GET | `/projects/:slug/export/download` | Download the final MP4 |

## Dependency Injection

All services use NestJS dependency injection. The module hierarchy ensures proper service availability:

```
AppModule
├── AiModule (agents, pipelines)
├── StorageModule (MongoDB schemas, AssetService, PipelineStateService, etc.)
├── PipelineModule (ImageGenerationService, SceneRendererService, etc.)
└── ProjectsModule (ProjectsService, ProjectsController)
```

## Error Handling

- NestJS exception filters handle HTTP errors.
- Pipeline failures are logged with timestamps and error messages.
- Failed stages can be retried or resumed.
- Asset generation failures are tracked per-scene.

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/phoenix-ai` | MongoDB connection string |
| `GEMINI_API_KEY` | — | Gemini API key (optional) |
| `OPENAI_API_KEY` | — | OpenAI API key (optional) |
| `PORT` | `3001` | API server port |
