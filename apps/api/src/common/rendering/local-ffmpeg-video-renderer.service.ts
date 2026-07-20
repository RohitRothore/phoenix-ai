import { Injectable, Logger } from '@nestjs/common';

import { LocalStorageService } from '../storage/local-storage.service';
import { FfmpegProcessService } from './ffmpeg-process.service';

export interface FfmpegSceneJob {
  id: number;
  duration: number;
  prompt: string;
  mood: string;
  scenePath: string;
}

export interface RenderedVideo {
  finalPath: string;
  duration: number;
  renderedAt: string;
}

@Injectable()
export class LocalFfmpegVideoRendererService {
  private readonly logger = new Logger(LocalFfmpegVideoRendererService.name);
  private static readonly WIDTH = 1080;
  private static readonly HEIGHT = 1920;
  private static readonly FRAME_RATE = 30;
  private static readonly FONT_PATH =
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

  constructor(
    private readonly storage: LocalStorageService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async render(
    projectSlug: string,
    scenes: FfmpegSceneJob[],
  ): Promise<RenderedVideo> {
    const projectPath = `projects/${projectSlug}`;
    const concatEntries: string[] = [];

    for (const scene of scenes) {
      const clipPath = `${projectPath}/${scene.scenePath}`;
      const textPath = `${projectPath}/video/render-text/scene-${scene.id}.txt`;
      await this.storage.writeText(textPath, this.createSceneText(scene));
      await this.storage.ensureDirectory(`${projectPath}/video`);

      await this.ffmpeg.run(
        [
          '-y',
          '-f',
          'lavfi',
          '-i',
          `color=c=${this.getBackgroundColor(scene.mood)}:s=${LocalFfmpegVideoRendererService.WIDTH}x${LocalFfmpegVideoRendererService.HEIGHT}:d=${scene.duration}`,
          '-vf',
          this.createDrawTextFilter(this.storage.getAbsolutePath(textPath)),
          '-r',
          String(LocalFfmpegVideoRendererService.FRAME_RATE),
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          this.storage.getAbsolutePath(clipPath),
        ],
        'render a scene',
      );
      concatEntries.push(`file '${this.storage.getAbsolutePath(clipPath)}'`);
    }

    const concatPath = `${projectPath}/video/concat.txt`;
    const finalPath = `${projectPath}/video/final.mp4`;
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

    const duration = scenes.reduce((total, scene) => total + scene.duration, 0);
    this.logger.log(
      `Rendered local fallback video for project "${projectSlug}", duration=${duration}s`,
    );

    return {
      finalPath: 'video/final.mp4',
      duration,
      renderedAt: new Date().toISOString(),
    };
  }

  private createSceneText(scene: FfmpegSceneJob): string {
    const prompt = scene.prompt.replace(/\s+/g, ' ').trim();
    const summary = prompt.length > 220 ? `${prompt.slice(0, 217)}...` : prompt;
    return `PHOENIX AI STUDIO\n\nSCENE ${scene.id}\n\n${summary}\n\nMood: ${scene.mood}`;
  }

  private createDrawTextFilter(textPath: string): string {
    return [
      `drawtext=fontfile=${LocalFfmpegVideoRendererService.FONT_PATH}`,
      `textfile=${textPath}`,
      'fontcolor=white',
      'fontsize=42',
      'line_spacing=16',
      'x=(w-text_w)/2',
      'y=(h-text_h)/2',
      'box=1',
      'boxcolor=black@0.42',
      'boxborderw=32',
    ].join(':');
  }

  private getBackgroundColor(mood: string): string {
    const normalizedMood = mood.toLowerCase();
    if (normalizedMood.includes('warm') || normalizedMood.includes('playful'))
      return '7c3aed';
    if (normalizedMood.includes('night') || normalizedMood.includes('tense'))
      return '172554';
    if (normalizedMood.includes('happy') || normalizedMood.includes('bright'))
      return 'b45309';
    return '1f2937';
  }
}
