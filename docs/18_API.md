# API Reference

## Base URL

```
http://localhost:3001/api
```

## Authentication

No authentication is required for the current version. All endpoints are publicly accessible.

## Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "message": "Description of the result",
  "data": { ... }
}
```

## Error Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Endpoints

### Project Management

#### Create Project

```
POST /projects
```

**Body:**
```json
{
  "name": "My Project",
  "language": "English",
  "platform": "YouTube Shorts",
  "style": "Comedy",
  "humor": "light"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully.",
  "data": {
    "id": "uuid",
    "name": "My Project",
    "slug": "my-project",
    "language": "English",
    "platform": "YouTube Shorts",
    "style": "Comedy",
    "humor": "light",
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### List Projects

```
GET /projects
```

**Response:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully.",
  "data": [ ... ]
}
```

#### Get Project

```
GET /projects/:slug
```

**Response:**
```json
{
  "success": true,
  "message": "Project retrieved successfully.",
  "data": { ... }
}
```

### AI Pipeline

#### Generate Director Plan

```
POST /projects/:slug/director-plan
```

#### Get Director Plan

```
GET /projects/:slug/director-plan
```

#### Generate Story

```
POST /projects/:slug/story
```

#### Get Story

```
GET /projects/:slug/story
```

#### Generate Scenes

```
POST /projects/:slug/scenes
```

#### Get Scenes

```
GET /projects/:slug/scenes
```

#### Generate Dialogues

```
POST /projects/:slug/dialogues
```

#### Get Dialogues

```
GET /projects/:slug/dialogues
```

#### Generate Render Prompts

```
POST /projects/:slug/prompts
```

#### Get Render Prompts

```
GET /projects/:slug/prompts
```

### Image Generation

#### Generate AI Images

```
POST /projects/:slug/images
```

Generates AI images for all scenes using the selected provider (Mock/Gemini/OpenAI/Pollinations).

**Response:**
```json
{
  "success": true,
  "message": "Images generated for 3 scenes.",
  "data": [
    {
      "sceneId": "1",
      "assetId": "uuid",
      "imageUrl": "http://...",
      "imagePath": "projects/slug/images/scene-1.png",
      "provider": "mock-image",
      "model": "mock-image-v1",
      "generationTime": 150,
      "width": 1024,
      "height": 1024,
      "seed": 12345
    }
  ]
}
```

#### Regenerate Image

```
POST /projects/:slug/images/:sceneId/regenerate
```

Regenerates a single scene's image.

#### Get Assets

```
GET /projects/:slug/assets?type=IMAGE
```

Query parameters:
- `type` (optional): Filter by asset type (IMAGE, VIDEO, AUDIO, SUBTITLE, EXPORT)

### Scene Rendering

#### Render All Scenes

```
POST /projects/:slug/render
```

Renders all scenes into video clips using FFmpeg.

**Response:**
```json
{
  "success": true,
  "message": "All scenes rendered. 3 scene videos created.",
  "data": [
    {
      "sceneId": "1",
      "videoPath": "projects/slug/renders/scene-1.mp4",
      "duration": 5,
      "width": 1080,
      "height": 1920,
      "fps": 30
    }
  ]
}
```

#### Render Single Scene

```
POST /projects/:slug/render/:sceneId
```

### Pipeline Status

#### Get Pipeline Status

```
GET /projects/:slug/pipeline
```

**Response:**
```json
{
  "success": true,
  "message": "Pipeline status retrieved successfully.",
  "data": {
    "projectId": "uuid",
    "projectName": "My Project",
    "stages": [
      {
        "stage": "director",
        "status": "completed",
        "startedAt": "2024-01-01T00:00:00.000Z",
        "completedAt": "2024-01-01T00:01:00.000Z",
        "retryCount": 0,
        "logs": [ ... ]
      }
    ],
    "jobs": [ ... ],
    "assets": [ ... ]
  }
}
```

#### Retry Stage

```
POST /projects/:slug/pipeline/:stage/retry
```

#### Resume Pipeline

```
POST /projects/:slug/pipeline/:stage/resume
```

### Export

#### Export Captioned MP4

```
POST /projects/:slug/export
```

#### Download Final MP4

```
GET /projects/:slug/export/download
```

Returns the final MP4 as a file download.

### Legacy: Video Plan

#### Prepare Video Jobs

```
POST /projects/:slug/video
```

#### Get Video Plan

```
GET /projects/:slug/video
```

#### Render Local MP4

```
POST /projects/:slug/video/render
```

#### Generate Subtitles

```
POST /projects/:slug/subtitles
```

#### Get Subtitles

```
GET /projects/:slug/subtitles
```

#### Generate Voice

```
POST /projects/:slug/voice
```

#### Get Voice

```
GET /projects/:slug/voice
```
