# Pipeline Engine

## Overview

The Pipeline Engine orchestrates the end-to-end video generation pipeline. Each stage has a well-defined status, timestamps, execution logs, and supports retry and resume.

## Pipeline Stages

| Stage | Description | Statuses |
|-------|-------------|----------|
| `director` | Director AI generates creative constraints | pending → running → completed/failed |
| `story` | Story AI generates plot and characters | pending → running → completed/failed |
| `scenes` | Scene Planner generates scene breakdown | pending → running → completed/failed |
| `dialogues` | Dialogue Generator writes character dialogue | pending → running → completed/failed |
| `prompts` | Prompt Generator creates render-ready prompts | pending → running → completed/failed |
| `image-generation` | Image Generator creates AI images per scene | pending → queued → running → completed/failed |
| `scene-rendering` | Scene Renderer renders images into video clips | pending → queued → running → completed/failed |
| `subtitle-generation` | Subtitle Generator creates SRT captions | pending → running → completed/failed |
| `voice-generation` | Voice Generator creates TTS audio | pending → running → completed/failed |
| `export` | FFmpeg Composer assembles final MP4 | pending → running → completed/failed |

## Stage Statuses

| Status | Description |
|--------|-------------|
| `pending` | Stage has not started yet |
| `queued` | Stage is waiting in the queue |
| `running` | Stage is currently executing |
| `completed` | Stage finished successfully |
| `failed` | Stage failed (error message stored) |
| `cancelled` | Stage was cancelled |

## Pipeline State Document

```typescript
interface PipelineState {
  projectId: string;
  stage: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  errorMessage?: string;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}
```

## Generation Job Document

```typescript
interface GenerationJob {
  projectId: string;
  sceneId: string;
  type: 'image' | 'video' | 'audio' | 'subtitle';
  provider: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  errorMessage?: string;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  response?: Record<string, unknown>;
}
```

## Pipeline Flow

```
1. User creates project → all stages set to "pending"
2. User clicks "Generate Director Plan" → director stage → "running" → "completed"
3. User clicks "Generate Story" → story stage → "running" → "completed"
4. User clicks "Plan Scenes" → scenes stage → "running" → "completed"
5. User clicks "Generate Dialogues" → dialogues stage → "running" → "completed"
6. User clicks "Build Render Prompts" → prompts stage → "running" → "completed"
7. User clicks "Generate AI Images" → image-generation stage → "running" → "completed"
   - Each scene → GenerationJob enqueued → image generated → Asset created
8. User clicks "Render All Scenes" → scene-rendering stage → "running" → "completed"
   - Each scene → video clip rendered → Asset created
9. User clicks "Generate Subtitles" → subtitle-generation stage → "running" → "completed"
10. User clicks "Generate Voice" → voice-generation stage → "running" → "completed"
11. User clicks "Export Captioned MP4" → export stage → "running" → "completed"
12. User downloads final MP4
```

## Retry

- Failed stages can be retried via `POST /projects/:slug/pipeline/:stage/retry`.
- The stage status is reset to `pending` and `retryCount` is incremented.
- The stage will be re-executed when the user triggers it again.

## Resume

- Cancelled or failed stages can be resumed via `POST /projects/:slug/pipeline/:stage/resume`.
- The stage status is reset to `pending`.
- The stage will be re-executed when the user triggers it again.

## Regeneration

- Individual images can be regenerated via `POST /projects/:slug/images/:sceneId/regenerate`.
- The existing image asset is deleted and a new one is generated.
- The generation job is re-enqueued.

## Pipeline Status API

```
GET /projects/:slug/pipeline
```

Returns:

```json
{
  "success": true,
  "message": "Pipeline status retrieved successfully.",
  "data": {
    "projectId": "...",
    "projectName": "...",
    "stages": [
      {
        "stage": "director",
        "status": "completed",
        "startedAt": "...",
        "completedAt": "...",
        "retryCount": 0,
        "logs": [...]
      }
    ],
    "jobs": [...],
    "assets": [...]
  }
}
```

## Phase 2 Transition

In Phase 2, the `image-generation` and `scene-rendering` stages will be merged into a single `video-generation` stage. The `VideoProvider` will generate full video clips directly. The downstream stages (subtitle-generation, voice-generation, export) remain unchanged.
