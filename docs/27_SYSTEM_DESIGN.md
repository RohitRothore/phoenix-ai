# System Design

## Overview

Phoenix AI is designed as a **modular, extensible, enterprise-grade** system. The architecture follows SOLID principles, uses NestJS dependency injection, and maintains clear separation of concerns.

## Design Principles

1. **SOLID** — Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion.
2. **DRY** — No duplicated logic.
3. **KISS** — Keep it simple, stupid.
4. **Backward Compatibility** — Phase 2 requires minimal changes.
5. **MongoDB-First** — All metadata in MongoDB, binaries on disk.
6. **Provider Abstraction** — Pluggable providers with a common interface.
7. **Mock Mode** — Always runnable without paid APIs.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                    Next.js Studio UI                             │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NESTJS API SERVER                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Projects   │  │   Pipeline  │  │   Assets    │             │
│  │  Module     │  │   Module    │  │   Module    │             │
│  │             │  │             │  │             │             │
│  │ - Projects  │  │ - ImageGen  │  │ - Asset     │             │
│  │   Service   │  │   Service   │  │   Service   │             │
│  │ - Projects  │  │ - Scene     │  │             │             │
│  │   Controller│  │   Renderer  │  │             │             │
│  │             │  │   Service   │  │             │             │
│  │             │  │ - Pipeline  │  │             │             │
│  │             │  │   State     │  │             │             │
│  │             │  │   Service   │  │             │             │
│  │             │  │ - Generation│  │             │             │
│  │             │  │   Queue     │  │             │             │
│  │             │  │   Service   │  │             │             │
│  │             │  │ - Project   │  │             │             │
│  │             │  │   Assembler │  │             │             │
│  │             │  │   Service   │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐             │
│  │   AI        │  │  Provider   │  │  Storage    │             │
│  │   Module    │  │  Module     │  │  Module     │             │
│  │             │  │             │  │             │             │
│  │ - Agents    │  │ - Registry  │  │ - MongoDB   │             │
│  │ - Pipelines │  │ - Factory   │  │   Schemas   │             │
│  │             │  │ - Providers │  │ - Mongo     │             │
│  │             │  │             │  │   Service   │             │
│  │             │  │             │  │ - Local     │             │
│  │             │  │             │  │   Storage   │             │
│  │             │  │             │  │   Service   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB DATABASE                          │
│                                                                 │
│  Collections: projects, projectartifacts, assets,               │
│               pipelinestates, generationjobs, exports           │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL FILE SYSTEM                        │
│                                                                 │
│  storage/                                                        │
│    projects/{slug}/images/     # AI images                       │
│    projects/{slug}/renders/    # FFmpeg video clips              │
│    projects/{slug}/audio/      # TTS audio                       │
│    projects/{slug}/subtitles/  # SRT files                       │
│    projects/{slug}/exports/    # Final MP4                       │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### Image Generation Flow

```
ProjectsController
  → ProjectsService.generateImages()
    → ImageGenerationService.generateImages()
      → ProviderRegistry.getImageProvider()
        → MockImageProvider.generateImage() / GeminiImageProvider.generateImage()
      → LocalStorageService.writeBinary()
      → AssetService.create()
      → GenerationQueueService.setStatus()
      → PipelineStateService.addLog()
```

### Scene Rendering Flow

```
ProjectsController
  → ProjectsService.renderProject()
    → SceneRendererService.renderScenes()
      → FfmpegProcessService.run()
      → LocalStorageService.writeBinary()
      → AssetService.create()
      → PipelineStateService.addLog()
```

### Pipeline Status Flow

```
ProjectsController
  → ProjectsService.getPipelineStatus()
    → PipelineStateService.findByProject()
    → GenerationQueueService.listByProject()
    → AssetService.listByProject()
```

## Error Handling Strategy

1. **HTTP Errors** — NestJS exception filters return structured error responses.
2. **Pipeline Errors** — Failed stages are logged with timestamps and error messages.
3. **Asset Errors** — Failed asset generation is tracked per-scene with retry support.
4. **Provider Errors** — Provider failures are caught and logged; fallback to Mock provider.

## Scalability Considerations

1. **Asynchronous Processing** — Pipeline stages can be executed asynchronously.
2. **Queue-based** — Generation jobs are queued for processing.
3. **Provider Pooling** — Multiple provider instances can be registered for load balancing.
4. **Caching** — Pipeline state and assets are cached in MongoDB.

## Security Considerations

1. **No Authentication** — Current version has no auth (development mode).
2. **Input Validation** — NestJS DTOs validate all inputs.
3. **File Path Safety** — LocalStorageService validates paths to prevent directory traversal.
4. **API Key Management** — API keys are loaded from environment variables.

## Testing Strategy

1. **Unit Tests** — Jest for service-level testing.
2. **Integration Tests** — Supertest for API endpoint testing.
3. **E2E Tests** — Full pipeline flow testing.
4. **Provider Tests** — Mock provider testing for CI/CD.

## Monitoring

1. **Pipeline Logs** — Every stage logs timestamps and messages.
2. **Asset Tracking** — Asset creation, update, and deletion are tracked.
3. **Error Tracking** — Failed stages and assets are tracked with error messages.
4. **Retry Tracking** — Retry counts are tracked per stage and per job.
