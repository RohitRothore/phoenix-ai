import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
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
  assContent?: string;
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
    private readonly storage: LocalStorageService,
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
    await fs.mkdir(path.join(tempDir, 'audio'), { recursive: true });

    try {
      const videoAssets = await this.assetService.listByProject(
        projectId,
        'VIDEO',
      );
      const audioAssets = await this.assetService.listByProject(
        projectId,
        'AUDIO',
      );

      const sortedClips = scenes
        .map((scene) => {
          const videoAsset = videoAssets.find(
            (a) =>
              String(a.sceneId) === String(scene.id) && a.status === 'ready',
          );
          const sceneAudioAssets = audioAssets
            .filter(
              (a) =>
                String(a.sceneId) === String(scene.id) && a.status === 'ready',
            )
            .sort((a, b) => (a.filename ?? '').localeCompare(b.filename ?? ''));
          return { scene, videoAsset, audioAssets: sceneAudioAssets };
        })
        .filter((item) => item.videoAsset);

      if (sortedClips.length === 0) {
        throw new Error('No rendered video clips found. Render scenes first.');
      }

      const clipPaths: string[] = [];
      const audioPaths: string[] = [];

      for (const {
        scene,
        videoAsset,
        audioAssets: sceneAudio,
      } of sortedClips) {
        const clipFile = path.join(tempDir, 'clips', `scene-${scene.id}.mp4`);
        let clipData: Buffer | null = null;

        if (videoAsset!.gridfsId) {
          clipData = await this.gridfs.downloadFile(
            String(videoAsset!.gridfsId),
          );
        } else if (videoAsset!.path?.startsWith('gridfs:')) {
          clipData = await this.gridfs.downloadFile(
            videoAsset!.path.replace('gridfs:', ''),
          );
        } else if (videoAsset!.path) {
          const absPath = this.storage.getAbsolutePath(videoAsset!.path);
          clipData = await fs.readFile(absPath);
        }

        if (clipData) {
          await fs.writeFile(clipFile, clipData);
          clipPaths.push(clipFile);
        }

        const sceneAudioFile = path.join(
          tempDir,
          'audio',
          `scene-${scene.id}-combined.wav`,
        );

        if (sceneAudio.length > 0) {
          const audioBuffers: Buffer[] = [];
          for (const aa of sceneAudio) {
            let data: Buffer | null = null;
            if (aa.gridfsId) {
              data = await this.gridfs.downloadFile(String(aa.gridfsId));
            } else if (aa.path?.startsWith('gridfs:')) {
              data = await this.gridfs.downloadFile(
                aa.path.replace('gridfs:', ''),
              );
            } else if (aa.path) {
              data = await fs.readFile(this.storage.getAbsolutePath(aa.path));
            }
            if (data) {
              const tmpMp3 = path.join(
                tempDir,
                'audio',
                `tmp-${scene.id}-${Math.random().toString(36).slice(2, 8)}.mp3`,
              );
              await fs.writeFile(tmpMp3, data);
              const tmpWav = tmpMp3.replace('.mp3', '.wav');
              await this.ffmpeg.run(
                ['-y', '-i', tmpMp3, '-ar', '16000', '-ac', '1', tmpWav],
                `convert audio ${aa.filename}`,
              );
              audioBuffers.push(await fs.readFile(tmpWav));
              await fs.rm(tmpMp3, { force: true });
              await fs.rm(tmpWav, { force: true });
            }
          }

          if (audioBuffers.length > 0) {
            const mergedAudio = path.join(
              tempDir,
              'audio',
              `scene-${scene.id}-merged.wav`,
            );
            if (audioBuffers.length === 1) {
              await fs.writeFile(mergedAudio, audioBuffers[0]);
            } else {
              const mergeInput = path.join(
                tempDir,
                'audio',
                `scene-${scene.id}-concat-input.txt`,
              );
              const lines: string[] = [];
              for (let i = 0; i < audioBuffers.length; i++) {
                const tmpFile = path.join(
                  tempDir,
                  'audio',
                  `scene-${scene.id}-part-${i}.wav`,
                );
                await fs.writeFile(tmpFile, audioBuffers[i]);
                lines.push(`file '${tmpFile}'`);
              }
              await fs.writeFile(mergeInput, lines.join('\n'));
              await this.ffmpeg.run(
                [
                  '-y',
                  '-f',
                  'concat',
                  '-safe',
                  '0',
                  '-i',
                  mergeInput,
                  '-c',
                  'copy',
                  mergedAudio,
                ],
                `merge audio scene ${scene.id}`,
              );
            }

            await this.ffmpeg.run(
              [
                '-y',
                '-i',
                mergedAudio,
                '-af',
                `apad=whole_dur=${scene.duration}`,
                '-t',
                String(scene.duration),
                '-ar',
                '16000',
                '-ac',
                '1',
                sceneAudioFile,
              ],
              `pad audio scene ${scene.id} to ${scene.duration}s`,
            );
          }
        }

        if (!sceneAudio || sceneAudio.length === 0) {
          const sampleRate = 16000;
          const numSamples = Math.floor(sampleRate * scene.duration);
          const header = Buffer.alloc(44);
          const dataSize = numSamples * 2;
          const fileSize = dataSize + 36;
          header.write('RIFF', 0);
          header.writeUInt32LE(fileSize, 4);
          header.write('WAVE', 8);
          header.write('fmt ', 12);
          header.writeUInt32LE(16, 16);
          header.writeUInt16LE(1, 20);
          header.writeUInt16LE(1, 22);
          header.writeUInt32LE(sampleRate, 24);
          header.writeUInt32LE(sampleRate * 2, 28);
          header.writeUInt16LE(2, 32);
          header.writeUInt16LE(16, 34);
          header.write('data', 36);
          header.writeUInt32LE(dataSize, 40);
          await fs.writeFile(
            sceneAudioFile,
            Buffer.concat([header, Buffer.alloc(numSamples * 2, 0)]),
          );
        }

        audioPaths.push(sceneAudioFile);
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

      const audioConcatFile = path.join(tempDir, 'concat-audio.txt');
      const audioConcatContent = audioPaths
        .map((p) => `file '${p}'`)
        .join('\n');
      await fs.writeFile(audioConcatFile, audioConcatContent);

      const concatAudio = path.join(tempDir, 'concat-audio.wav');
      await this.ffmpeg.run(
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          audioConcatFile,
          '-c',
          'copy',
          concatAudio,
        ],
        'concatenate scene audio',
      );

      const { srtContent, assContent } = input;

      let subtitleFile: string;
      let subtitleFilter: string;

      if (assContent) {
        subtitleFile = path.join(tempDir, 'subtitles.ass');
        await fs.writeFile(subtitleFile, assContent);
        subtitleFilter = `ass=${subtitleFile}`;
      } else {
        subtitleFile = path.join(tempDir, 'subtitles.srt');
        await fs.writeFile(subtitleFile, srtContent);
        subtitleFilter = `subtitles=${subtitleFile}:force_style='FontName=DejaVu Sans,FontSize=12,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=4,BackColour=&H80000000,Outline=0,Alignment=2,MarginV=80,MarginL=60,MarginR=60'`;
      }

      const withSubtitles = path.join(tempDir, 'with-subtitles.mp4');
      await this.ffmpeg.run(
        [
          '-y',
          '-i',
          concatVideo,
          '-i',
          concatAudio,
          '-vf',
          subtitleFilter,
          '-c:v',
          'libx264',
          '-preset',
          'slow',
          '-crf',
          '18',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-ar',
          '48000',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-shortest',
          withSubtitles,
        ],
        'mux video + audio + subtitles',
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
