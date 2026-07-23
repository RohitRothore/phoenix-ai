# Storage Engine

## Overview

Phoenix AI uses **MongoDB** as the primary database for all metadata, pipeline state, and asset references. **Binary assets** (images, videos, audio, subtitles, exports) are stored on disk in the `storage/` directory.

## Design Principles

1. **MongoDB is the source of truth** for all metadata.
2. **Only binary assets on disk** — no metadata files.
3. **Asset documents reference disk paths** — never duplicate metadata.
4. **Schema-compatible with future video generation** — Asset types include IMAGE, VIDEO, AUDIO, SUBTITLE, EXPORT.

## MongoDB Collections

### projects

Stores project metadata.

```typescript
interface Project {
  _id: ObjectId;
  id: string;           // UUID
  name: string;
  slug: string;         // URL-friendly unique identifier
  language: string;
  platform: string;
  style: string;
  humor: string;
  status: string;       // draft, ready, error
  createdAt: string;
  updatedAt: string;
}
```

### projectartifacts

Stores pipeline artifacts (director plan, story, scenes, dialogues, prompts, video plan, subtitles, voice).

```typescript
interface ProjectArtifact {
  _id: ObjectId;
  projectId: string;    // References Project.id
  type: string;         // director, story, scenes, dialogues, prompts, video, subtitles, voice
  data: Record<string, unknown>;  // The artifact content
  status: string;       // pending, ready, error
  createdAt: string;
  updatedAt: string;
}
```

### assets (NEW)

Stores asset metadata for all generated files.

```typescript
interface Asset {
  _id: ObjectId;
  projectId: string;    // References Project.id
  sceneId?: string;     // References scene ID
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SUBTITLE' | 'EXPORT';
  filename: string;     // File name on disk
  path: string;         // Relative path on disk (e.g., "projects/{slug}/images/scene-1.png")
  url?: string;         // URL for remote assets (image providers)
  width?: number;
  height?: number;
  duration?: number;    // For video/audio assets (seconds)
  provider?: string;    // e.g., "mock-image", "gemini", "ffmpeg"
  model?: string;       // e.g., "gemini-2.0-flash", "local-renderer-v1"
  generationTime?: number;  // Milliseconds
  seed?: number;        // For image generation
  status: 'pending' | 'generating' | 'ready' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;  // Additional metadata (prompt, camera, lighting, etc.)
  createdAt: string;
  updatedAt: string;
}
```

### pipelinestates (NEW)

Tracks the status of each pipeline stage.

```typescript
interface PipelineState {
  _id: ObjectId;
  projectId: string;
  stage: string;        // director, story, scenes, dialogues, prompts, image-generation, scene-rendering, subtitle-generation, voice-generation, export
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount: number;
  errorMessage?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### generationjobs (NEW)

Tracks per-scene generation jobs.

```typescript
interface GenerationJob {
  _id: ObjectId;
  projectId: string;
  sceneId: string;
  type: string;         // image, video, audio, subtitle
  provider: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  retryCount: number;
  errorMessage?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  response?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### exports (NEW)

Tracks export metadata.

```typescript
interface Export {
  _id: ObjectId;
  projectId: string;
  filename: string;
  path: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  fileSize?: number;
  resolution?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Disk Storage Layout

```
storage/
├── projects/
│   ├── {slug}/
│   │   ├── images/            # AI-generated images (PNG)
│   │   ├── renders/           # FFmpeg-rendered scene clips (MP4)
│   │   ├── audio/             # TTS audio files (MP3/WAV)
│   │   ├── subtitles/         # SRT caption files
│   │   └── exports/           # Final MP4 exports
│   └── generated/             # Shared generated assets
│       ├── audio/
│       └── video/
```

## Asset Lifecycle

1. **Image Generation**: `ImageGenerationService` generates an image → saves to `storage/projects/{slug}/images/` → creates Asset document in MongoDB.
2. **Scene Rendering**: `SceneRendererService` renders image into video clip → saves to `storage/projects/{slug}/renders/` → creates Asset document in MongoDB.
3. **Export**: `ProjectAssemblerService` assembles final MP4 → saves to `storage/projects/{slug}/exports/` → creates Export document in MongoDB.

## Local Storage Service

The `LocalStorageService` provides file I/O operations:

```typescript
class LocalStorageService {
  getAbsolutePath(relativePath: string): string;
  async createDirectory(path: string): Promise<void>;
  async ensureDirectory(path: string): Promise<void>;
  async writeBinary(path: string, buffer: Buffer): Promise<void>;
  async readBinary(path: string): Promise<Buffer>;
  async writeText(path: string, content: string): Promise<void>;
  async readText(path: string): Promise<string>;
}
```

## Phase 2 Compatibility

The Asset schema is designed to be compatible with future video generation:
- `IMAGE` assets will be replaced by `VIDEO` assets from the `VideoProvider`.
- The `SceneRendererService` will be bypassed when `VideoProvider` is available.
- The `ProjectAssemblerService` will stitch `VIDEO` assets instead of `IMAGE` assets.
