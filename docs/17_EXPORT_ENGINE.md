# Export Engine

## Overview

The Export Engine assembles the final MP4 from scene video clips, audio, and subtitles. It uses FFmpeg to stitch everything together into a polished, captioned video.

## Export Flow

```
1. Scene clips are rendered (VIDEO assets in MongoDB)
2. Subtitles are generated (SRT file)
3. Voice audio is generated (optional)
4. Background music is generated (optional)
5. ProjectAssemblerService assembles the final MP4:
   a. Stitch scene clips together
   b. Add subtitles (burned-in or soft)
   c. Add voice audio
   d. Add background music
6. Save final MP4 to storage/projects/{slug}/exports/
7. Create EXPORT Asset document in MongoDB
```

## ProjectAssemblerService

The `ProjectAssemblerService` is responsible for the final assembly:

```typescript
interface AssembleExportInput {
  projectId: string;
  projectSlug: string;
  scenes: Array<{
    id: string;
    duration: number;
    imagePath: string;  // Video clip path
  }>;
}
```

### Assembly Steps

1. **Concatenate scene clips** — Uses FFmpeg concat demuxer to stitch clips.
2. **Add subtitles** — Burns SRT captions into the video or adds as soft subtitles.
3. **Add audio** — Mixes voice audio and background music.
4. **Export** — Saves the final MP4.

## FFmpeg Commands

### Concatenate Clips

```bash
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy final.mp4
```

### Add Subtitles

```bash
ffmpeg -y -i final.mp4 -vf "subtitles=captions.srt" -c:a copy output.mp4
```

### Add Audio

```bash
ffmpeg -y -i final.mp4 -i voice.mp3 -i music.mp3 \
  -filter_complex "[1:a][2:a]amix=inputs=2:duration=first" \
  -c:v copy -c:a aac output.mp4
```

## Export Output

| Property | Value |
|----------|-------|
| Format | MP4 |
| Video Codec | H.264 |
| Audio Codec | AAC |
| Resolution | 1080×1920 (portrait) |
| FPS | 30 |

## Export Asset

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

## Download

The final MP4 can be downloaded via:

```
GET /projects/:slug/export/download
```

This endpoint returns the file as an attachment with the appropriate content type and headers.

## Phase 2 Compatibility

In Phase 2, the export flow remains the same. The only difference is that scene clips come from the `VideoProvider` instead of the `SceneRendererService`. The `ProjectAssemblerService` treats all `VIDEO` assets identically, regardless of their source.

## Legacy: Local FFmpeg Export

The `LocalFfmpegExportService` provides a legacy export path that:
1. Takes a video file and SRT file.
2. Burns subtitles into the video.
3. Returns the output path.

This is used by the "Video" step in the Studio UI for the legacy video rendering flow.
