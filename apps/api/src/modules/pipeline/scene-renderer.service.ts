import { Injectable, Logger } from '@nestjs/common';
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

    const tempDir = path.join(SceneRendererService.TEMP_DIR, projectSlug);
    await fs.mkdir(tempDir, { recursive: true });

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

        const tempClipPath = path.join(tempDir, `scene-${scene.id}.mp4`);

        let absImagePath: string;
        const imageGridfsId = scene.imagePath?.replace('gridfs:', '') ?? '';
        if (imageGridfsId) {
          const imageData = await this.gridfs.downloadFile(imageGridfsId);
          const tempImagePath = path.join(tempDir, `image-${scene.id}.png`);
          await fs.writeFile(tempImagePath, imageData);
          absImagePath = tempImagePath;
        } else {
          absImagePath = this.storage.getAbsolutePath(scene.imagePath);
        }

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
            tempClipPath,
          ],
          `render scene ${scene.id}`,
        );

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
    const scale = `scale=${width}:${height}`;
    const pad = `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    switch (movement) {
      case 'zoom-in':
        return `${scale},${pad},zoompan=z='min(zoom+0.001,1.5)':d=1:s=${width}x${height}:fps=30`;
      case 'zoom-out':
        return `${scale},${pad},zoompan=z='max(zoom-0.001,1.0)':d=1:s=${width}x${height}:fps=30`;
      case 'pan-left':
        return `${scale},${pad},zoompan=z='1.2':x='iw/2-(iw/zoom/2)+((iw/zoom)*0.1)*on':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=30`;
      case 'pan-right':
        return `${scale},${pad},zoompan=z='1.2':x='iw/2-(iw/zoom/2)-((iw/zoom)*0.1)*on':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=30`;
      case 'pan-up':
        return `${scale},${pad},zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+((ih/zoom)*0.05)*on':d=1:s=${width}x${height}:fps=30`;
      case 'pan-down':
        return `${scale},${pad},zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-((ih/zoom)*0.05)*on':d=1:s=${width}x${height}:fps=30`;
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
