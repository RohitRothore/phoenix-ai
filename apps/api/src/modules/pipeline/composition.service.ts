import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';
import { ProjectAssemblerService } from './project-assembler.service';

const execFileAsync = promisify(execFile);

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
    const { projectId, projectSlug, scenes } = input;

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

      // Sort scenes by ID to ensure deterministic ordering
      const sortedScenes = [...scenes].sort((a, b) =>
        Number(a.id) < Number(b.id) ? -1 : Number(a.id) > Number(b.id) ? 1 : 0,
      );

      // Build scene data, ensuring every scene has a video asset
      const sceneData = sortedScenes.map((scene) => {
        const videoAsset = videoAssets.find(
          (a) => String(a.sceneId) === String(scene.id) && a.status === 'ready',
        );
        if (!videoAsset) {
          throw new Error(
            `No rendered video clip found for scene ${scene.id}. Render all scenes first.`,
          );
        }

        // Sort audio assets by scene ID, not filename
        const sceneAudioAssets = audioAssets
          .filter(
            (a) =>
              String(a.sceneId) === String(scene.id) && a.status === 'ready',
          )
          .sort((a, b) => {
            const idA = Number(a.sceneId ?? '0');
            const idB = Number(b.sceneId ?? '0');
            return idA < idB ? -1 : idA > idB ? 1 : 0;
          });

        return { scene, videoAsset, audioAssets: sceneAudioAssets };
      });

      const clipPaths: string[] = [];
      const audioPaths: string[] = [];
      let totalDuration = 0;

      for (const { scene, videoAsset, audioAssets: sceneAudio } of sceneData) {
        const clipFile = path.join(tempDir, 'clips', `scene-${scene.id}.mp4`);
        let clipData: Buffer | null = null;

        if (videoAsset.gridfsId) {
          clipData = await this.gridfs.downloadFile(
            String(videoAsset.gridfsId),
          );
        } else if (videoAsset.path?.startsWith('gridfs:')) {
          clipData = await this.gridfs.downloadFile(
            videoAsset.path.replace('gridfs:', ''),
          );
        } else if (videoAsset.path) {
          const absPath = this.storage.getAbsolutePath(videoAsset.path);
          clipData = await fs.readFile(absPath);
        }

        if (!clipData?.length) {
          throw new Error(
            `Rendered video data for scene ${scene.id} could not be loaded. Re-render that scene before composing.`,
          );
        }
        await fs.writeFile(clipFile, clipData);

        // Determine the effective scene duration:
        // use the max of scene duration, video asset duration, and audio duration
        const videoDuration = videoAsset.duration ?? scene.duration;
        const maxAudioDuration = Math.max(
          ...sceneAudio.map((a) => a.duration || 0),
        );
        const effectiveSceneDuration = Math.max(
          scene.duration,
          videoDuration,
          maxAudioDuration,
        );

        // Pad video to effective duration if needed
        const paddedClipFile = path.join(
          tempDir,
          'clips',
          `scene-${scene.id}-padded.mp4`,
        );
        await this.normalizeVideoDuration(
          clipFile,
          paddedClipFile,
          effectiveSceneDuration,
        );
        clipPaths.push(paddedClipFile);

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
              const tmpInput = path.join(
                tempDir,
                'audio',
                `tmp-${scene.id}-${Math.random().toString(36).slice(2, 8)}.wav`,
              );
              await fs.writeFile(tmpInput, data);
              const tmpWav = path.join(
                tempDir,
                'audio',
                `converted-${scene.id}-${Math.random().toString(36).slice(2, 8)}.wav`,
              );
              await this.ffmpeg.run(
                ['-y', '-i', tmpInput, '-ar', '44100', '-ac', '1', tmpWav],
                `convert audio ${aa.filename}`,
              );
              audioBuffers.push(await fs.readFile(tmpWav));
              await fs.rm(tmpInput, { force: true }).catch(() => {});
              await fs.rm(tmpWav, { force: true }).catch(() => {});
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

            // Pad audio to effective scene duration
            await this.ffmpeg.run(
              [
                '-y',
                '-i',
                mergedAudio,
                '-af',
                `apad=whole_dur=${effectiveSceneDuration}`,
                '-t',
                String(effectiveSceneDuration),
                '-ar',
                '44100',
                '-ac',
                '1',
                sceneAudioFile,
              ],
              `pad audio scene ${scene.id} to ${effectiveSceneDuration}s`,
            );
          }
        }

        if (!sceneAudio || sceneAudio.length === 0) {
          const sampleRate = 44100;
          const numSamples = Math.floor(sampleRate * effectiveSceneDuration);
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
        totalDuration += effectiveSceneDuration;
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

      const { srtContent: srt, assContent } = input;

      let subtitleFile: string;
      let subtitleFilter: string;

      if (assContent) {
        subtitleFile = path.join(tempDir, 'subtitles.ass');
        await fs.writeFile(subtitleFile, assContent);
        subtitleFilter = `ass=${subtitleFile}`;
      } else {
        subtitleFile = path.join(tempDir, 'subtitles.srt');
        await fs.writeFile(subtitleFile, srt);
        subtitleFilter = `subtitles=${subtitleFile}:force_style='FontName=DejaVu Sans,FontSize=12,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=4,BackColour=&H80000000,Outline=0,Alignment=2,MarginV=80,MarginL=60,MarginR=60'`;
      }

      const withSubtitles = path.join(tempDir, 'with-subtitles.mp4');
      // Use -t to set output duration to totalDuration instead of -shortest
      // This prevents cutting audio or video prematurely
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
          '-t',
          String(totalDuration),
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

  /**
   * Ensures the video clip duration matches the target duration.
   * If the video is shorter, pads with duplicated last frames (tpad).
   * If the video is longer, cuts to the target duration.
   */
  private async normalizeVideoDuration(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
  ): Promise<void> {
    await fs.access(inputPath);

    // Get the actual video duration
    let actualDuration = 0;
    try {
      const { stdout } = await execFileAsync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          inputPath,
        ],
        { timeout: 10000 },
      );
      actualDuration = parseFloat(stdout.trim());
    } catch {
      // If ffprobe fails, assume the video is already the correct duration
      await fs.copyFile(inputPath, outputPath);
      return;
    }

    if (isNaN(actualDuration) || actualDuration <= 0) {
      await fs.copyFile(inputPath, outputPath);
      return;
    }

    const diff = targetDuration - actualDuration;

    if (Math.abs(diff) < 0.1) {
      // Duration is close enough, just copy
      await fs.copyFile(inputPath, outputPath);
      return;
    }

    if (diff > 0) {
      // Video is shorter, pad with duplicated last frames
      await this.ffmpeg.run(
        [
          '-y',
          '-i',
          inputPath,
          '-vf',
          `tpad=stop_mode=clone:stop_duration=${diff}`,
          '-c:v',
          'libx264',
          '-c:a',
          'copy',
          '-pix_fmt',
          'yuv420p',
          outputPath,
        ],
        `pad video to ${targetDuration}s`,
      );
    } else {
      // Video is longer, cut to target duration
      await this.ffmpeg.run(
        [
          '-y',
          '-i',
          inputPath,
          '-c',
          'copy',
          '-t',
          String(targetDuration),
          outputPath,
        ],
        `cut video to ${targetDuration}s`,
      );
    }
  }
}
