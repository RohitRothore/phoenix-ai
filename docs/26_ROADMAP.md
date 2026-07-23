# Roadmap

## Phase 1: AI Images → FFmpeg Video (Current)

**Status**: In Progress

### Goals

1. ✅ AI image generation (Mock/Gemini/OpenAI/Pollinations)
2. ✅ FFmpeg scene rendering (camera movements: zoom, pan, fade)
3. ✅ MongoDB storage for all metadata and assets
4. ✅ Pipeline state management (status, timestamps, logs, retry, resume)
5. ✅ Studio UI with image display, provider, status, regenerate, download
6. ✅ Scene rendering with video preview
7. ✅ Pipeline status and logs
8. ✅ Export to final MP4

### Completed

- [x] ImageProvider interface in ai-core contracts
- [x] MockImageProvider, GeminiImageProvider, OpenAIImageProvider, PollinationsImageProvider
- [x] FutureImageProvider (marked as future implementation)
- [x] Asset, PipelineState, GenerationJob, Export MongoDB schemas
- [x] ImageGenerationService, PromptEnhancerService, SceneRendererService
- [x] AssetService, PipelineStateService, GenerationQueueService, ProjectAssemblerService
- [x] API endpoints for image generation, scene rendering, pipeline status
- [x] Studio UI with AI Images and Render steps
- [x] FFmpeg scene renderer with camera movements
- [x] Documentation updates

## Phase 2: AI Video Providers (Future)

**Status**: Planned

### Goals

1. Introduce `VideoProvider` interface
2. Replace `ImageProvider` + `SceneRendererService` with `VideoProvider`
3. Generate full video clips directly from prompts
4. Maintain backward compatibility with Phase 1

### Tasks

- [ ] Add `VideoProvider` interface to ai-core contracts
- [ ] Implement concrete video providers (e.g., Runway, Pika, Kaiber)
- [ ] Update `ProviderRegistry` to support `VideoProvider`
- [ ] Update `ImageGenerationService` to use `VideoProvider` when available
- [ ] Merge `image-generation` and `scene-rendering` stages into `video-generation`
- [ ] Update Studio UI to show video generation status
- [ ] Update documentation

### Phase 2 Transition

```
Phase 1:  ImageProvider → ImageEnhancer → SceneRenderer (FFmpeg)
Phase 2:  VideoProvider (replaces all three above)
```

The `VideoProvider` generates full video clips directly. The downstream pipeline (subtitles, voice, music, composition) is unchanged.

## Phase 3: Advanced Features (Future)

### Goals

1. Voice generation (TTS)
2. Music generation (background score)
3. Advanced subtitle generation
4. Multi-language support
5. Batch processing
6. Export formats (MP4, MOV, AVI, GIF)
7. Video editing tools
8. Collaboration features

## Timeline

| Phase | Status | Timeline |
|-------|--------|----------|
| Phase 1 | In Progress | Q3 2026 |
| Phase 2 | Planned | Q4 2026 |
| Phase 3 | Planned | Q1 2027 |
