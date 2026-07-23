# Project Vision

## Vision Statement

Phoenix AI is an AI Video Studio that transforms a single text prompt into a complete, polished MP4 video through a fully orchestrated, multi-agent AI pipeline.

## Phase 1: AI Images → FFmpeg Video (Current)

In Phase 1, the pipeline generates **AI images** for each scene. These images are then animated into video clips using **FFmpeg** with camera movements (zoom, pan, fade). The scene clips are stitched together into a final MP4.

**Why Phase 1?**
- AI video generation APIs are expensive and rate-limited.
- FFmpeg-based animation produces high-quality, controllable results.
- The pipeline architecture is identical to Phase 2 — only the provider changes.
- Developers and users can run the full pipeline without paid APIs (Mock mode).

### Phase 1 Pipeline

```
Text Prompt
    ↓
Director Agent
    ↓
Story Agent
    ↓
Scene Planner
    ↓
Dialogue Generator
    ↓
Prompt Generator
    ↓
Image Generator         ← AI Images (Mock/Gemini/OpenAI/Pollinations)
    ↓
Image Enhancer          ← Prompt enhancement
    ↓
Scene Renderer          ← FFmpeg: images → video clips
    ↓
Subtitle Generator
    ↓
Voice Generator
    ↓
Music Generator
    ↓
FFmpeg Composer
    ↓
Final MP4
```

## Phase 2: AI Video Generation (Future)

In Phase 2, the `ImageProvider` is replaced with a `VideoProvider`. The `VideoProvider` generates full video clips directly (no FFmpeg animation needed). The remaining pipeline — scene planning, dialogue, prompts, subtitles, voice, music, composition — stays exactly the same.

### Phase 2 Pipeline (Minimal Change)

```
Text Prompt
    ↓
Director Agent
    ↓
Story Agent
    ↓
Scene Planner
    ↓
Dialogue Generator
    ↓
Prompt Generator
    ↓
Video Provider        ← AI Videos (replaces ImageProvider + Scene Renderer)
    ↓
Subtitle Generator
    ↓
Voice Generator
    ↓
Music Generator
    ↓
FFmpeg Composer
    ↓
Final MP4
```

## Core Principles

1. **MongoDB-first** — All metadata, pipeline state, and asset references live in MongoDB.
2. **Disk for binaries only** — Images, videos, audio, subtitles, and exports are stored on disk.
3. **Provider abstraction** — Pluggable providers with a common interface.
4. **Mock mode by default** — The project is always runnable without paid APIs.
5. **Backward compatible** — Phase 2 requires minimal changes.
6. **Enterprise-grade** — SOLID principles, NestJS DI, strict TypeScript, reusable interfaces.
7. **Pipeline state management** — Every stage has pending/queued/running/completed/failed/cancelled status with timestamps, logs, retry, and resume support.
