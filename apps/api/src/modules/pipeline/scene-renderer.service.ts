import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
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

  constructor(
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly storage: LocalStorageService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async renderScenes(input: SceneRenderInput): Promise<SceneRenderResult[]> {
    const { projectId, projectSlug, scenes } = input;
    const width = SceneRendererService.DEFAULT_WIDTH;
    const height = SceneRendererService.DEFAULT_HEIGHT;
    const fps = input.frameRate ?? SceneRendererService.DEFAULT_FPS;
    const results: SceneRenderResult[] = [];

    await this.pipelineState.setStatus(projectId, 'scene-rendering', 'running');
    await this.pipelineState.addLog(projectId, 'scene-rendering', {
      timestamp: new Date(),
      level: 'info',
      message: `Starting scene rendering for ${scenes.length} scenes`,
    });

    const concatEntries: string[] = [];

    for (const scene of scenes) {
      try {
        await this.pipelineState.addLog(projectId, 'scene-rendering', {
          timestamp: new Date(),
          level: 'info',
          message: `Rendering scene ${scene.id}`,
        });

        const clipPath = `projects/${projectSlug}/renders/scene-${scene.id}.mp4`;
        const absClipPath = this.storage.getAbsolutePath(clipPath);
        const absImagePath = this.storage.getAbsolutePath(scene.imagePath);

        await this.storage.ensureDirectory(`projects/${projectSlug}/renders`);

        const movement = this.determineCameraMovement(scene.prompt);
        const filter = this.buildVideoFilter(movement, width, height);

        await this.ffmpeg.run(
          [
            '-y',
            '-loop',
            '1',
            '-i',
            absImagePath,
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
            '-t',
            String(scene.duration),
            '-shortest',
            absClipPath,
          ],
          `render scene ${scene.id}`,
        );

        concatEntries.push(`file '${absClipPath}'`);

        // Create video asset
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

    // Stitch all scenes together
    const concatPath = `projects/${projectSlug}/renders/concat.txt`;
    const finalPath = `projects/${projectSlug}/renders/final.mp4`;
    await this.storage.writeText(concatPath, concatEntries.join('\n'));

    await this.ffmpeg.run(
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        this.storage.getAbsolutePath(concatPath),
        '-c',
        'copy',
        this.storage.getAbsolutePath(finalPath),
      ],
      'stitch scene clips',
    );

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

    return results;
  }

  private determineCameraMovement(prompt: RenderPrompt): CameraMovement {
    const mood = prompt.mood.toLowerCase();
    const camera = prompt.camera.toLowerCase();

    if (camera.includes('zoom') || mood.includes('intense')) return 'zoom-in';
    if (camera.includes('pan') || mood.includes('mysterious'))
      return 'pan-left';
    if (mood.includes('dramatic') || camera.includes('tilt')) return 'pan-up';
    if (mood.includes('calm') || mood.includes('peaceful')) return 'static';
    return 'static';
  }

  private buildVideoFilter(
    movement: CameraMovement,
    width: number,
    height: number,
  ): string {
    const scale = `scale=${width}:${height}:force_original`;
    const pad = `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    switch (movement) {
      case 'zoom-in':
        return `${scale},${pad},zoompan=z='min(zoom+0.001,1.5)':d=1:s=${width}x${height}:fps=30`;
      case 'zoom-out':
        return `${scale},${pad},zoompan=z='max(zoom-0.001,1.0)':d=1:s=${width}x${height}:fps=30`;
      case 'pan-left':
        return `${scale},${pad},pad=${width * 2}:${height}:${width}:0,trim=duration=5`;
      case 'pan-right':
        return `${scale},${pad},pad=${width * 2}:${height}:0:0,trim=duration=5`;
      case 'pan-up':
        return `${scale},${pad},pad=${width}:${height * 2}:0:${height},trim=duration=5`;
      case 'pan-down':
        return `${scale},${pad},pad=${width}:${height * 2}:0:0,trim=duration=5`;
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
