# Decision Log

## 2026-07-23: Phase 1 Architecture — AI Images → FFmpeg Video

**Decision**: Implement Phase 1 as AI image generation followed by FFmpeg scene rendering.

**Rationale**:
- AI video generation APIs are expensive and rate-limited.
- FFmpeg-based animation produces high-quality, controllable results.
- The pipeline architecture is identical to Phase 2 — only the provider changes.
- Developers and users can run the full pipeline without paid APIs (Mock mode).

**Impact**:
- Added `ImageProvider` interface to ai-core contracts.
- Added `MockImageProvider`, `GeminiImageProvider`, `OpenAIImageProvider`, `PollinationsImageProvider`.
- Added `FutureImageProvider` (marked as future implementation).
- Added `Asset`, `PipelineState`, `GenerationJob`, `Export` MongoDB schemas.
- Added `ImageGenerationService`, `PromptEnhancerService`, `SceneRendererService`.
- Added `AssetService`, `PipelineStateService`, `GenerationQueueService`, `ProjectAssemblerService`.
- Added API endpoints for image generation, scene rendering, pipeline status.
- Added Studio UI with AI Images and Render steps.
- Added FFmpeg scene renderer with camera movements.
- Updated documentation.

## 2026-07-23: MongoDB as Primary Database

**Decision**: Use MongoDB as the primary database. Only binary assets on disk.

**Rationale**:
- MongoDB's flexible schema allows easy extension for new asset types.
- Asset documents can reference disk paths without duplicating metadata.
- The schema is compatible with future video generation (Phase 2).

**Impact**:
- Added `Asset` collection with types: IMAGE, VIDEO, AUDIO, SUBTITLE, EXPORT.
- Added `PipelineState` collection for stage status tracking.
- Added `GenerationJob` collection for per-scene job tracking.
- Added `Export` collection for export metadata.
- MongoDB remains the primary database; no JSON files for metadata.

## 2026-07-23: Provider Registry Pattern

**Decision**: Use a Provider Registry pattern with a common `ImageProvider` interface.

**Rationale**:
- No provider is hardcoded.
- New providers can be added without changing existing code.
- Mock mode is always available when no API key is set.
- Phase 2 can introduce a `VideoProvider` without changing the pipeline.

**Impact**:
- `ProviderRegistry` is registered as a NestJS token (`PROVIDER_REGISTRY`).
- Provider selection is based on API key availability.
- `ImageGenerationService` uses the registry to get the active provider.

## 2026-07-23: Pipeline State Management

**Decision**: Use a `PipelineState` document per (project, stage) pair with status, timestamps, logs, retry, and resume.

**Rationale**:
- Every stage needs a well-defined status.
- Failed stages need to be retried or resumed.
- Execution logs provide full auditability.
- The pipeline status API returns all stages, jobs, and assets.

**Impact**:
- Added `PipelineStateService` with setStatus, addLog, findByProject, retry, resume.
- Added `GenerationQueueService` with enqueue, setStatus, setResponse, listByProject.
- Added API endpoints for pipeline status, retry, and resume.
- Studio UI displays pipeline status with stage badges.

## 2026-07-23: FFmpeg Scene Renderer

**Decision**: Use FFmpeg for scene rendering with camera movements.

**Rationale**:
- FFmpeg is installed locally and provides full control.
- Camera movements (zoom, pan, fade) are controllable via FFmpeg filters.
- No dependency on external video processing services.
- Phase 2 can bypass FFmpeg when the VideoProvider generates clips directly.

**Impact**:
- Added `SceneRendererService` with renderScenes method.
- Added `FfmpegProcessService` as a low-level FFmpeg wrapper.
- Added camera movement support: zoom-in, zoom-out, pan-left, pan-right, pan-up, pan-down, slow-camera-motion, fade, cross-fade, blur-transition.
- Each scene clip is stored as a VIDEO Asset in MongoDB.
- Scene clips are stitched into a final MP4 using FFmpeg concat.
