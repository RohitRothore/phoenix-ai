import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
import { ProjectAssemblerService } from './project-assembler.service';

export interface CompositionInput {
  projectId: string;
  projectSlug: string;
  scenes: Array<{
    id: string;
    duration: number;
  }>;
  srtContent: string;
}

export interface CompositionResult {
  finalPath: string;
  duration: number;
  exportedAt: string;
}

@Injectable()
export class CompositionService {
  private readonly logger = new Logger(CompositionService.name);

  private static readonly TEMP_DIR = '/tmp/phoenix-composition';

  constructor(
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly gridfs: GridFsService,
    private readonly ffmpeg: FfmpegProcessService,
    private readonly projectAssembler: ProjectAssemblerService,
  ) {}

  async compose(input: CompositionInput): Promise<CompositionResult> {
    const { projectId, projectSlug, scenes, srtContent } = input;

    await this.pipelineState.setStatus(projectId, 'export', 'running');
    await this.pipelineState.addLog(projectId, 'export', {
      timestamp: new Date(),
      level: 'info',
      message: 'Starting final composition',
    });

    const tempDir = path.join(CompositionService.TEMP_DIR, projectSlug);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'clips'), { recursive: true });

    try {
      const videoAssets = await this.assetService.listByProject(
        projectId,
        'VIDEO',
      );

      const sortedClips = scenes
        .map((scene) => {
          const asset = videoAssets.find(
            (a) => a.sceneId === scene.id && a.status === 'ready',
          );
          return { scene, asset };
        })
        .filter((item) => item.asset);

      if (sortedClips.length === 0) {
        throw new Error('No rendered video clips found. Render scenes first.');
      }

      const clipPaths: string[] = [];
      for (const { scene, asset } of sortedClips) {
        let gridfsId = asset!.gridfsId ? String(asset!.gridfsId) : '';
        if (!gridfsId && asset!.path?.startsWith('gridfs:')) {
          gridfsId = asset!.path.replace('gridfs:', '');
        }
        if (gridfsId) {
          const data = await this.gridfs.downloadFile(gridfsId);
          const clipFile = path.join(tempDir, 'clips', `scene-${scene.id}.mp4`);
          await fs.writeFile(clipFile, data);
          clipPaths.push(clipFile);
        }
      }

      const concatFile = path.join(tempDir, 'concat.txt');
      const concatContent = clipPaths.map((p) => `file '${p}'`).join('\n');
      await fs.writeFile(concatFile, concatContent);

      const concatVideo = path.join(tempDir, 'concat-video.mp4');
      await this.ffmpeg.run(
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatFile,
          '-c',
          'copy',
          concatVideo,
        ],
        'concatenate scene clips',
      );

      const srtFile = path.join(tempDir, 'subtitles.srt');
      await fs.writeFile(srtFile, srtContent);

      const withSubtitles = path.join(tempDir, 'with-subtitles.mp4');
      await this.ffmpeg.run(
        [
          '-y',
          '-i',
          concatVideo,
          '-vf',
          `subtitles=${srtFile}:force_style='FontName=DejaVu Sans,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2,MarginV=90'`,
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          withSubtitles,
        ],
        'burn subtitles into video',
      );

      const finalFilename = `${projectSlug}-final.mp4`;
      const finalData = await fs.readFile(withSubtitles);
      const gridfsId = await this.gridfs.uploadFile(
        `exports/${finalFilename}`,
        finalData,
        { projectId, type: 'final-export' },
      );

      const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

      await this.projectAssembler.assembleExport({
        projectId,
        projectSlug,
        scenes: scenes.map((s) => ({
          id: s.id,
          duration: s.duration,
          imagePath: '',
        })),
      });

      await this.pipelineState.setStatus(projectId, 'export', 'completed');
      await this.pipelineState.addLog(projectId, 'export', {
        timestamp: new Date(),
        level: 'info',
        message: `Final composition completed: ${finalFilename}`,
      });

      return {
        finalPath: `gridfs:${gridfsId}`,
        duration: totalDuration,
        exportedAt: new Date().toISOString(),
      };
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Composition failed: ${error.message}`);
      await this.pipelineState.setStatus(projectId, 'export', 'failed');
      await this.pipelineState.addLog(projectId, 'export', {
        timestamp: new Date(),
        level: 'error',
        message: `Composition failed: ${error.message}`,
      });
      throw e;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
