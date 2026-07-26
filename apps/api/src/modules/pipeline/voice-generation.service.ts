import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Inject } from '@nestjs/common';
import { PROVIDER_REGISTRY } from '../provider/provider.module';
import { ProviderRegistry } from '@phoenix/providers';
import { AssetService } from '../assets/asset.service';
import { PipelineStateService } from './pipeline-state.service';
import { GridFsService } from '../../common/storage/gridfs.service';
import { FfmpegProcessService } from '../../common/rendering/ffmpeg-process.service';

const execFileAsync = promisify(execFile);

export interface VoiceLineResult {
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  audioAssetId: string;
  duration: number;
  status: 'ready' | 'error';
  errorMessage?: string;
}

export interface VoiceGenerationResult {
  lines: VoiceLineResult[];
  totalDuration: number;
}

export interface VoiceGenerationInput {
  projectId: string;
  projectSlug: string;
  language: string;
  scenes: Array<{
    id: number;
    duration: number;
    dialogue: Array<{
      character: string;
      text: string;
      emotion: string;
      timing: string;
    }>;
  }>;
}

interface GenderedVoice {
  voice: string;
  gender: 'male' | 'female';
}

@Injectable()
export class VoiceGenerationService {
  private readonly logger = new Logger(VoiceGenerationService.name);

  private readonly englishMaleVoices: GenderedVoice[] = [
    { voice: 'en-US-GuyNeural', gender: 'male' },
    { voice: 'en-US-DavisNeural', gender: 'male' },
    { voice: 'en-US-TonyNeural', gender: 'male' },
    { voice: 'en-US-AndrewNeural', gender: 'male' },
  ];

  private readonly englishFemaleVoices: GenderedVoice[] = [
    { voice: 'en-US-JennyNeural', gender: 'female' },
    { voice: 'en-US-AriaNeural', gender: 'female' },
    { voice: 'en-US-SaraNeural', gender: 'female' },
    { voice: 'en-US-NancyNeural', gender: 'female' },
  ];

  private readonly hindiMaleVoices: GenderedVoice[] = [
    { voice: 'hi-IN-MadhurNeural', gender: 'male' },
    { voice: 'hi-IN-SureshNeural', gender: 'male' },
  ];

  private readonly hindiFemaleVoices: GenderedVoice[] = [
    { voice: 'hi-IN-SwaraNeural', gender: 'female' },
  ];

  private readonly COMEDY_PAUSES: Record<string, number> = {
    opening: 0.0,
    reaction: 0.15,
    buildup: 0.0,
    punchline: 0.25,
    exit: 0.1,
  };

  private characterVoiceAssignment = new Map<
    string,
    { voice: string; gender: 'male' | 'female' }
  >();
  private maleVoiceIndex = 0;
  private femaleVoiceIndex = 0;

  constructor(
    @Inject(PROVIDER_REGISTRY)
    private readonly registry: ProviderRegistry,
    private readonly assetService: AssetService,
    private readonly pipelineState: PipelineStateService,
    private readonly gridfs: GridFsService,
    private readonly ffmpeg: FfmpegProcessService,
  ) {}

  async generateVoice(
    input: VoiceGenerationInput,
  ): Promise<VoiceGenerationResult> {
    const { projectId, projectSlug, language, scenes } = input;
    const results: VoiceLineResult[] = [];
    let totalDuration = 0;

    this.characterVoiceAssignment.clear();
    this.maleVoiceIndex = 0;
    this.femaleVoiceIndex = 0;

    const isHindi =
      language.toLowerCase().includes('hindi') ||
      language.toLowerCase().includes('hi');

    await this.pipelineState.setStatus(
      projectId,
      'voice-generation',
      'running',
    );
    await this.pipelineState.addLog(projectId, 'voice-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Starting voice generation for ${scenes.length} scenes`,
    });

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-gen-'));

    try {
      for (const scene of scenes) {
        const lineBuffers: Array<{ buffer: Buffer; duration: number }> = [];

        for (const line of scene.dialogue) {
          try {
            const assigned = this.getVoiceForCharacter(line.character, isHindi);

            let audioBuffer: Buffer;
            let duration = this.estimateDuration(line.text);

            const ttsResult = await this.callTTS(
              line.text,
              assigned.voice,
              line.emotion,
            );
            if (ttsResult) {
              audioBuffer = ttsResult.buffer;
              duration = ttsResult.duration;
            } else {
              audioBuffer = this.generateSilentAudio(duration);
            }

            const pauseDuration = this.COMEDY_PAUSES[line.timing] ?? 0;
            if (pauseDuration > 0) {
              const pauseBuffer = this.generateSilentAudio(pauseDuration);
              audioBuffer = Buffer.concat([pauseBuffer, audioBuffer]);
              duration += pauseDuration;
            }

            lineBuffers.push({ buffer: audioBuffer, duration });

            results.push({
              sceneId: String(scene.id),
              character: line.character,
              text: line.text,
              emotion: line.emotion,
              audioAssetId: '',
              duration,
              status: 'ready',
            });

            totalDuration += duration;
          } catch (e) {
            const error = e as Error;
            this.logger.warn(
              `Failed to generate voice for scene ${scene.id}, character ${line.character}: ${error.message}`,
            );
            results.push({
              sceneId: String(scene.id),
              character: line.character,
              text: line.text,
              emotion: line.emotion,
              audioAssetId: '',
              duration: this.estimateDuration(line.text),
              status: 'error',
              errorMessage: error.message,
            });
          }
        }

        if (lineBuffers.length === 0) continue;

        const mergedBuffer = await this.mergeAudioBuffers(
          lineBuffers,
          tmpDir,
          scene.id,
        );

        const existing = await this.assetService.findByProjectAndScene(
          projectId,
          String(scene.id),
          'AUDIO',
        );
        if (existing) {
          const oldGridfsId = existing.path?.replace('gridfs:', '') ?? '';
          if (oldGridfsId) {
            await this.gridfs.deleteFile(oldGridfsId).catch(() => {});
          }
          await this.assetService.delete(existing._id?.toString() ?? '');
        }

        const filename = `${projectSlug}/audio/scene-${scene.id}.wav`;
        const gridfsId = await this.gridfs.uploadFile(filename, mergedBuffer, {
          projectId,
          sceneId: scene.id,
          linesCount: lineBuffers.length,
        });

        const sceneDuration = lineBuffers.reduce(
          (sum, b) => sum + b.duration,
          0,
        );

        const asset = await this.assetService.create({
          projectId,
          sceneId: String(scene.id),
          type: 'AUDIO',
          filename: `scene-${scene.id}.wav`,
          path: `gridfs:${gridfsId}`,
          url: filename,
          duration: sceneDuration,
          provider: 'edge-tts',
          model: 'edge-neural',
          metadata: {
            linesCount: lineBuffers.length,
            language,
            gridfsId,
          },
        });

        await this.assetService.update(asset._id?.toString() ?? '', {
          status: 'ready',
        });

        const sceneResults = results.filter(
          (r) => r.sceneId === String(scene.id) && r.status === 'ready',
        );
        for (const r of sceneResults) {
          r.audioAssetId = asset._id?.toString() ?? '';
        }
      }
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    await this.pipelineState.setStatus(
      projectId,
      'voice-generation',
      'completed',
    );
    await this.pipelineState.addLog(projectId, 'voice-generation', {
      timestamp: new Date(),
      level: 'info',
      message: `Voice generation completed for ${results.length} lines`,
    });

    return { lines: results, totalDuration };
  }

  private async mergeAudioBuffers(
    buffers: Array<{ buffer: Buffer; duration: number }>,
    tmpDir: string,
    sceneId: number,
  ): Promise<Buffer> {
    if (buffers.length === 1) {
      return buffers[0].buffer;
    }

    const partFiles: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const partPath = path.join(tmpDir, `scene-${sceneId}-part-${i}.wav`);
      await fs.writeFile(partPath, buffers[i].buffer);
      partFiles.push(partPath);
    }

    const concatList = path.join(tmpDir, `scene-${sceneId}-concat.txt`);
    const content = partFiles.map((f) => `file '${f}'`).join('\n');
    await fs.writeFile(concatList, content);

    const mergedPath = path.join(tmpDir, `scene-${sceneId}-merged.wav`);
    await this.ffmpeg.run(
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatList,
        '-c',
        'copy',
        mergedPath,
      ],
      `merge audio scene ${sceneId}`,
    );

    const mergedBuffer = await fs.readFile(mergedPath);

    for (const f of partFiles) {
      await fs.rm(f, { force: true }).catch(() => {});
    }
    await fs.rm(concatList, { force: true }).catch(() => {});
    await fs.rm(mergedPath, { force: true }).catch(() => {});

    return mergedBuffer;
  }

  private async callTTS(
    text: string,
    voice: string,
    emotion: string,
  ): Promise<{ buffer: Buffer; duration: number } | null> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tts-'));
    const outFile = path.join(tmpDir, 'output.mp3');

    try {
      await execFileAsync(
        'edge-tts',
        ['--voice', voice, '--text', text, '--write-media', outFile],
        { timeout: 30000 },
      );

      const buffer = await fs.readFile(outFile);
      let duration = await this.getAudioDuration(outFile);
      if (duration <= 0) {
        duration = this.estimateDuration(text);
      }
      return { buffer, duration };
    } catch (e) {
      const sanitized = text.replace(/[^\w\s\u0900-\u097F.,!?]/g, '').trim();
      if (sanitized && sanitized !== text && sanitized.length > 0) {
        this.logger.warn(
          `TTS failed for original text, retrying sanitized: "${text}" -> "${sanitized}"`,
        );
        try {
          await execFileAsync(
            'edge-tts',
            ['--voice', voice, '--text', sanitized, '--write-media', outFile],
            { timeout: 30000 },
          );
          const buffer = await fs.readFile(outFile);
          let duration = await this.getAudioDuration(outFile);
          if (duration <= 0) {
            duration = this.estimateDuration(sanitized);
          }
          return { buffer, duration };
        } catch (e2) {
          this.logger.warn(
            `TTS retry also failed for "${sanitized}": ${(e2 as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `TTS failed for text "${text}" with voice ${voice}: ${(e as Error).message}`,
        );
      }
      return null;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private getVoiceForCharacter(
    character: string,
    isHindi: boolean,
  ): { voice: string; gender: 'male' | 'female' } {
    if (this.characterVoiceAssignment.has(character)) {
      return this.characterVoiceAssignment.get(character)!;
    }

    const isMale = this.isMaleCharacter(character);
    const gender: 'male' | 'female' = isMale ? 'male' : 'female';

    let voice: string;
    if (isHindi) {
      if (isMale) {
        const voices = this.hindiMaleVoices;
        voice =
          voices[this.maleVoiceIndex % voices.length]?.voice ??
          'hi-IN-MadhurNeural';
        this.maleVoiceIndex++;
      } else {
        const voices = this.hindiFemaleVoices;
        voice =
          voices[this.femaleVoiceIndex % voices.length]?.voice ??
          'hi-IN-SwaraNeural';
        this.femaleVoiceIndex++;
      }
    } else {
      if (isMale) {
        const voices = this.englishMaleVoices;
        voice =
          voices[this.maleVoiceIndex % voices.length]?.voice ??
          'en-US-GuyNeural';
        this.maleVoiceIndex++;
      } else {
        const voices = this.englishFemaleVoices;
        voice =
          voices[this.femaleVoiceIndex % voices.length]?.voice ??
          'en-US-JennyNeural';
        this.femaleVoiceIndex++;
      }
    }

    const assignment = { voice, gender };
    this.characterVoiceAssignment.set(character, assignment);
    return assignment;
  }

  private isMaleCharacter(name: string): boolean {
    const n = name.toLowerCase();
    const femaleIndicators = [
      'mrs',
      'ms',
      'miss',
      'aunty',
      'mom',
      'mother',
      'wife',
      'sister',
      'girl',
      'lady',
      'woman',
      'bhabhi',
      'didi',
      'beti',
    ];
    return !femaleIndicators.some((indicator) => n.includes(indicator));
  }

  private async getAudioDuration(filePath: string): Promise<number> {
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
          filePath,
        ],
        { timeout: 10000 },
      );
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration) && duration > 0) {
        return duration;
      }
    } catch {
      this.logger.warn(
        'ffprobe duration measurement failed, falling back to estimate',
      );
    }
    return 0;
  }

  private generateSilentAudio(durationSeconds: number): Buffer {
    const sampleRate = 16000;
    const numSamples = Math.floor(sampleRate * durationSeconds);
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

    const silentData = Buffer.alloc(numSamples * 2, 0);
    return Buffer.concat([header, silentData]);
  }

  private estimateDuration(text: string): number {
    const wordsPerSecond = 3;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, wordCount / wordsPerSecond);
  }
}
