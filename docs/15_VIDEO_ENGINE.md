# Video Engine

## Overview

The Video Engine renders AI-generated images into video clips using **FFmpeg**. Each scene's image is animated with camera movements and stitched together into a final MP4.

## Phase 1: Image → Video Clip (Current)

In Phase 1, each scene has an AI-generated **image**. The `SceneRendererService` uses FFmpeg to:

1. Take the scene's image as input.
2. Apply a camera movement (zoom, pan, fade).
3. Render a video clip of the specified duration.
4. Save the clip to disk.
5. Store the clip as a `VIDEO` Asset in MongoDB.

## Camera Movements

The Video Engine supports the following camera movements:

| Movement | FFmpeg Filter | Description |
|----------|---------------|-------------|
| `zoom-in` | `zoompan` | Gradually zoom in on the image |
| `zoom-out` | `zoompan` | Gradually zoom out from the image |
| `pan-left` | `pad` + `trim` | Pan the view to the left |
| `pan-right` | `pad` + `trim` | Pan the view to the right |
| `pan-up` | `pad` + `trim` | Pan the view upward |
| `pan-down` | `pad` + `trim` | Pan the view downward |
| `slow-camera-motion` | `setpts` | Slow down the playback |
| `fade` | `fade` | Fade in and out |
| `cross-fade` | `fade` | Cross-fade transition |
| `blur-transition` | `gblur` | Apply blur effect |
| `static` | (none) | No camera movement |

## Scene Rendering Process

```
1. Input: Scene image (PNG), scene duration, prompt (camera, lighting, mood)
2. Determine camera movement from prompt
3. Build FFmpeg video filter chain
4. Execute FFmpeg: image → video clip (MP4)
5. Save clip to storage/projects/{slug}/renders/scene-{id}.mp4
6. Create VIDEO Asset document in MongoDB
7. Stitch all clips into final.mp4
```

## FFmpeg Integration

The `FfmpegProcessService` provides a low-level wrapper around the FFmpeg binary:

```typescript
class FfmpegProcessService {
  async run(args: string[], description: string): Promise<void>;
}
```

The `SceneRendererService` builds FFmpeg arguments for each scene:

```typescript
const args = [
  '-y',
  '-loop', '1',
  '-i', absImagePath,
  '-vf', filter,
  '-c:v', 'libx264',
  '-tune', 'stillimage',
  '-pix_fmt', 'yuv420p',
  '-r', String(fps),
  '-t', String(duration),
  '-shortest',
  absClipPath,
];
```

## Output Specifications

| Property | Value |
|----------|-------|
| Resolution | 1080×1920 (portrait) |
| FPS | 30 |
| Codec | H.264 (libx264) |
| Pixel Format | yuv420p |
| Container | MP4 |

## Scene Clip Assembly

After all scenes are rendered, the `SceneRendererService` stitches them together:

```typescript
// Create concat file
const concatPath = `projects/${slug}/renders/concat.txt`;
await storage.writeText(concatPath, concatEntries.join('\n'));

// Stitch clips
await ffmpeg.run([
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', absConcatPath,
  '-c', 'copy',
  absFinalPath,
]);
```

## Phase 2 Transition

In Phase 2, the `VideoProvider` will generate full video clips directly. The `SceneRendererService` will be bypassed. The downstream pipeline (subtitles, voice, music, composition) remains unchanged.

The transition is seamless because:
- `VIDEO` assets from Phase 1 and Phase 2 have the same schema.
- The `ProjectAssemblerService` stitches `VIDEO` assets regardless of their source.
- The `AssetService` treats all video assets identically.

## Export Engine

The `ProjectAssemblerService` assembles the final export:

1. Takes all scene video clips.
2. Optionally adds subtitles (SRT).
3. Optionally adds voice audio.
4. Optionally adds background music.
5. Stitches everything into a final MP4.
6. Saves to `storage/projects/{slug}/exports/`.
7. Creates an `EXPORT` Asset document in MongoDB.

## Future: AI Video Providers (Phase 2)

In Phase 2, the `VideoProvider` will:
- Generate full video clips directly from prompts.
- Replace the `ImageProvider` + `SceneRendererService` flow.
- Produce `VIDEO` assets with the same schema.
- Support the same camera movements as FFmpeg (as metadata).

The `FutureImageProvider` is already marked as "Future Implementation" and will be replaced by a concrete `VideoProvider` in Phase 2.
