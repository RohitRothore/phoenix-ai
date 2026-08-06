import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
import { RenderPrompt } from '../ai/agents/prompt/prompt.types';

export interface SceneRenderResult {
  sceneId: string;
  videoPath: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

export interface SceneRenderInput {
  projectId: string;
  projectSlug: string;
  scenes: Array<{
    id: string;
    duration: number;
    imagePath: string;
    prompt: RenderPrompt;
    audioPath?: string;
  }>;
  resolution?: string;
  frameRate?: number;
}

export type CameraMovement =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'slow-camera-motion'
  | 'fade'
  | 'cross-fade'
  | 'blur-transition'
  | 'static';

@Injectable()
export class SceneRendererService {
  private readonly logger = new Logger(SceneRendererService.name);

  private static readonly DEFAULT_WIDTH = 1080;
  private static readonly DEFAULT_HEIGHT = 1920;
  private static readonly DEFAULT_FPS = 30;
  private static readonly TEMP_DIR = '/tmp/phoenix-render';

  constructor(
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly storage: LocalStorageService,
    private readonly gridfs: GridFsService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async renderScenes(input: SceneRenderInput): Promise<SceneRenderResult[]> {
    const { projectId, projectSlug, scenes } = input;
    const width = SceneRendererService.DEFAULT_WIDTH;
    const height = SceneRendererService.DEFAULT_HEIGHT;
    const fps = input.frameRate ?? SceneRendererService.DEFAULT_FPS;
    const results: SceneRenderResult[] = [];

    // Sort scenes by ID to ensure deterministic rendering order
    const sortedScenes = [...scenes].sort((a, b) =>
      Number(a.id) < Number(b.id) ? -1 : Number(a.id) > Number(b.id) ? 1 : 0,
    );

    const tempDir = path.join(SceneRendererService.TEMP_DIR, projectSlug);
    await fs.mkdir(tempDir, { recursive: true });

    await this.pipelineState.setStatus(projectId, 'scene-rendering', 'running');
    await this.pipelineState.addLog(projectId, 'scene-rendering', {
      timestamp: new Date(),
      level: 'info',
      message: `Starting scene rendering for ${sortedScenes.length} scenes`,
    });

    const concatEntries: string[] = [];

    const missingImages = sortedScenes
      .filter((scene) => !scene.imagePath?.trim())
      .map((scene) => scene.id);
    if (missingImages.length > 0) {
      throw new ConflictException(
        `Cannot render without images for scene(s): ${missingImages.join(', ')}.`,
      );
    }

    for (const [sceneIndex, scene] of sortedScenes.entries()) {
      try {
        await this.pipelineState.addLog(projectId, 'scene-rendering', {
          timestamp: new Date(),
          level: 'info',
          message: `Rendering scene ${scene.id}`,
        });

        const tempClipPath = path.join(tempDir, `scene-${scene.id}.mp4`);

        let absImagePath: string;
        const imageGridfsId = scene.imagePath?.replace('gridfs:', '') ?? '';
        if (imageGridfsId) {
          const imageData = await this.gridfs.downloadFile(imageGridfsId);
          if (!imageData?.length) {
            throw new Error(`Image data for scene ${scene.id} is empty.`);
          }
          const tempImagePath = path.join(tempDir, `image-${scene.id}.png`);
          await fs.writeFile(tempImagePath, imageData);
          absImagePath = tempImagePath;
        } else {
          absImagePath = this.storage.getAbsolutePath(scene.imagePath);
        }

        const movement = this.determineCameraMovement(
          scene.prompt,
          sceneIndex,
          sortedScenes.length,
        );
        const filter = this.buildVideoFilter(
          movement,
          width,
          height,
          scene.duration,
          fps,
        );

        // Supplying the input frame rate is important here: zoompan advances one
        // step per input frame. Without it, camera moves can be imperceptibly
        // slow or inconsistent between machines.
        const ffmpegArgs: string[] = [
          '-y',
          '-loop',
          '1',
          '-framerate',
          String(fps),
          '-i',
          absImagePath,
        ];

        let hasAudio = false;
        if (scene.audioPath) {
          try {
            const audioGridfsId = scene.audioPath?.replace('gridfs:', '') ?? '';
            if (audioGridfsId) {
              const audioData = await this.gridfs.downloadFile(audioGridfsId);
              const tempAudioPath = path.join(tempDir, `audio-${scene.id}.wav`);
              await fs.writeFile(tempAudioPath, audioData);
              ffmpegArgs.push('-i', tempAudioPath);
            } else {
              const audioAbsPath = this.storage.getAbsolutePath(
                scene.audioPath,
              );
              ffmpegArgs.push('-i', audioAbsPath);
            }
            hasAudio = true;
          } catch (e) {
            this.logger.warn(
              `Failed to load audio for scene ${scene.id}: ${(e as Error).message}`,
            );
          }
        }

        ffmpegArgs.push(
          '-vf',
          filter,
          '-c:v',
          'libx264',
          '-tune',
          'stillimage',
          '-pix_fmt',
          'yuv420p',
          '-r',
          String(fps),
        );

        if (hasAudio) {
          // Pad or trim audio to match scene duration so the video clip
          // always has exactly scene.duration seconds of audio.
          // This prevents -shortest from cutting the video early when
          // the audio is shorter than the scene duration.
          ffmpegArgs.push(
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-ac',
            '1',
            '-af',
            `apad=whole_dur=${scene.duration}`,
            '-t',
            String(scene.duration),
          );
        } else {
          ffmpegArgs.push('-an');
        }

        ffmpegArgs.push('-t', String(scene.duration), tempClipPath);

        await this.ffmpeg.run(ffmpegArgs, `render scene ${scene.id}`);

        const clipData = await fs.readFile(tempClipPath);
        const gridfsFilename = `${projectSlug}/renders/scene-${scene.id}.mp4`;
        const gridfsId = await this.gridfs.uploadFile(
          gridfsFilename,
          clipData,
          {
            projectId,
            sceneId: scene.id,
            cameraMovement: movement,
            resolution: `${width}x${height}`,
            frameRate: fps,
          },
        );

        const clipPath = `gridfs:${gridfsId}`;

        concatEntries.push(`file '${tempClipPath}'`);

        const existing = await this.assetService.findByProjectAndScene(
          projectId,
          scene.id,
          'VIDEO',
        );
        if (existing) {
          await this.assetService.delete(existing._id?.toString() ?? '');
        }

        const asset = await this.assetService.create({
          projectId,
          sceneId: scene.id,
          type: 'VIDEO',
          filename: `scene-${scene.id}.mp4`,
          path: clipPath,
          width,
          height,
          duration: scene.duration,
          provider: 'ffmpeg',
          model: 'local-renderer-v1',
          metadata: {
            cameraMovement: movement,
            resolution: `${width}x${height}`,
            frameRate: fps,
            prompt: scene.prompt.prompt,
            gridfsId,
          },
        });

        await this.assetService.update(asset._id?.toString() ?? '', {
          status: 'ready',
        });

        results.push({
          sceneId: scene.id,
          videoPath: clipPath,
          duration: scene.duration,
          width,
          height,
          fps,
        });

        await this.pipelineState.addLog(projectId, 'scene-rendering', {
          timestamp: new Date(),
          level: 'info',
          message: `Scene ${scene.id} rendered successfully`,
        });
      } catch (e) {
        const error = e as Error;
        this.logger.error(
          `Failed to render scene ${scene.id}: ${error.message}`,
        );
        await this.pipelineState.addLog(projectId, 'scene-rendering', {
          timestamp: new Date(),
          level: 'error',
          message: `Failed to render scene ${scene.id}: ${error.message}`,
        });
        await this.pipelineState.setStatus(
          projectId,
          'scene-rendering',
          'failed',
        );
        throw e;
      }
    }

    await this.pipelineState.setStatus(
      projectId,
      'scene-rendering',
      'completed',
    );
    await this.pipelineState.addLog(projectId, 'scene-rendering', {
      timestamp: new Date(),
      level: 'info',
      message: `Scene rendering completed for ${results.length} scenes`,
    });

    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return results;
  }

  /**
   * Assigns a camera movement to each scene for visual variety.
   *
   * The RenderPrompt's camera/lighting/mood fields are typically empty strings
   * (the PromptBuilderPrompt instructs the AI to leave them blank). This method
   * therefore falls back to **scene-position-based** assignment so that images
   * always get dynamic zoom / pan effects instead of rendering as static stills.
   */
  private determineCameraMovement(
    prompt: RenderPrompt,
    sceneIndex: number,
    totalScenes: number,
  ): CameraMovement {
    const mood = prompt.mood.toLowerCase();
    const camera = prompt.camera.toLowerCase();

    // Honour explicit camera / mood direction if the prompt provides it
    if (camera.includes('zoom')) return 'zoom-in';
    if (camera.includes('pan')) return 'pan-left';
    if (mood.includes('intense') || mood.includes('dramatic')) return 'zoom-in';
    if (mood.includes('mysterious')) return 'pan-left';
    if (mood.includes('calm') || mood.includes('peaceful')) return 'zoom-out';

    // Position-based assignment for visual variety
    const isFirst = sceneIndex === 0;
    const isLast = sceneIndex === totalScenes - 1;

    // Hook scene (first): strong zoom-in to grab attention immediately
    if (isFirst) return 'zoom-in';

    // Punchline scene (last): dramatic zoom-in for comedic impact
    if (isLast) return 'zoom-in';

    // Middle scenes: rotate through varied movements to keep things dynamic.
    // A prime multiplier spreads the cycle so short videos still get variety.
    const variety: CameraMovement[] = [
      'zoom-in',
      'zoom-out',
      'pan-left',
      'pan-right',
      'pan-up',
      'pan-down',
    ];
    const idx = (sceneIndex * 7 + Math.floor(sceneIndex / 2)) % variety.length;
    return variety[idx];
  }

  /**
   * Builds the FFmpeg video filter chain for the given camera movement.
   *
   * Each path is calculated from the scene's exact frame count. This makes
   * movement finish naturally at the end of a 3-second scene as well as a
   * 12-second scene, instead of either barely moving or hitting a zoom cap.
   */
  private buildVideoFilter(
    movement: CameraMovement,
    width: number,
    height: number,
    duration: number,
    fps: number,
  ): string {
    const scale = `scale=${width}:${height}`;
    const pad = `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    const lastFrame = Math.max(1, totalFrames - 1);
    const zoomStart = 1.18;
    const zoomStep = ((zoomStart - 1) / lastFrame).toFixed(6);
    const zoomPan = (options: string) =>
      `zoompan=${options}:d=1:s=${width}x${height}:fps=${fps}`;
    // A short fade prevents hard cuts while retaining nearly all of each scene.
    const fadeIn = 'fade=t=in:st=0:d=0.3';
    const fadeOutStart = Math.max(0, duration - 0.3).toFixed(3);
    const fades = `${fadeIn},fade=t=out:st=${fadeOutStart}:d=0.3`;

    switch (movement) {
      case 'zoom-in':
        return `${scale},${pad},${zoomPan(`z='min(zoom+${zoomStep},${zoomStart})'`)},${fades}`;
      case 'zoom-out':
        return `${scale},${pad},${zoomPan(`z='if(eq(on,0),${zoomStart},max(1,zoom-${zoomStep}))'`)},${fades}`;
      case 'pan-left':
        return `${scale},${pad},${zoomPan(`z='1.14':x='(iw-iw/zoom)*(on/${lastFrame})':y='(ih-ih/zoom)/2'`)},${fades}`;
      case 'pan-right':
        return `${scale},${pad},${zoomPan(`z='1.14':x='(iw-iw/zoom)*(1-on/${lastFrame})':y='(ih-ih/zoom)/2'`)},${fades}`;
      case 'pan-up':
        return `${scale},${pad},${zoomPan(`z='1.14':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/${lastFrame})'`)},${fades}`;
      case 'pan-down':
        return `${scale},${pad},${zoomPan(`z='1.14':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/${lastFrame})'`)},${fades}`;
      case 'fade':
        return `${scale},${pad},fade=t=in:st=0:d=1,fade=t=out:st=4:d=1`;
      case 'cross-fade':
        return `${scale},${pad},fade=t=in:st=0:d=1`;
      case 'blur-transition':
        return `${scale},${pad},gblur=sigma=2`;
      case 'slow-camera-motion':
        return `${scale},${pad},setpts=2*PTS`;
      case 'static':
      default:
        return `${scale},${pad}`;
    }
  }
}
